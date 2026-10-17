// @ts-check
/**
 * @file worker-pool.js
 * WorkerPool — Generic Web Worker pool แบบ lazy initialization
 *
 * การปรับปรุง v4.0:
 *  - Lazy init: workers สร้างตอนใช้งานจริงครั้งแรก
 *    หน้าที่ไม่มีการแปลภาษา = ไม่เสีย resource เลย
 *  - Shared blob URL: Blob สร้างครั้งเดียว ทุก worker ใช้ URL เดียวกัน
 *  - blob URL ถูก revoke เมื่อ destroy (ป้องกัน memory leak)
 *  - Worker error handling เพิ่มเข้ามา
 *
 * @module worker-pool
 */
(function(M) {
  'use strict';
  
  class WorkerPool {
    
    /**
     * @param {string} workerCode  — source code ของ worker (string)
     * @param {number} poolSize    — จำนวน worker สูงสุด
     */
    constructor(workerCode, poolSize, inlineFn) {
      this._code = workerCode;
      this._size = poolSize;
      this._inline = inlineFn || null; // S6: fallback เมื่อสร้าง Worker ไม่ได้
      this._fallback = false;         // true = ทำงานบนเธรดหลักแทน worker
      this._blobUrl = null; // shared URL สำหรับทุก worker
      
      /** @type {Worker[]} */
      this._workers = [];
      /** @type {Worker[]} */
      this._idle = [];
      /** @type {Array<{data:any, resolve:Function, reject:Function}>} */
      this._queue = [];
      /** @type {Map<Worker, {data:any, resolve:Function, reject:Function}>} */
      this._jobMap = new Map();
      
      this._ready = false;
    }
    
    // ── Lazy initialization ───────────────────────────────────────────────────
    
    /**
     * สร้าง workers เมื่อต้องการครั้งแรก (idempotent)
     * @private
     */
    _ensureReady() {
      if (this._ready) return;
      
      try {
        // สร้าง blob URL ครั้งเดียว ใช้ร่วมกันทุก worker
        const blob = new Blob([this._code], { type: 'application/javascript' });
        this._blobUrl = URL.createObjectURL(blob);
        
        for (let i = 0; i < this._size; i++) {
          const w = new Worker(this._blobUrl);
          w.onmessage = (e) => this._onMessage(w, e);
          w.onerror = (e) => this._onError(w, e);
          this._workers.push(w);
          this._idle.push(w);
        }
      } catch (e) {
        // S6: CSP บลอก blob worker หรือสภาวะแวกล้องไม่รองรับ
        // → สลับไปทำงานบนเธรดหลักแทน โดยไม่ต้องอาศัย CSP
        console.warn('[WorkerPool] Worker unavailable, using main-thread fallback:', e && e.message);
        this._workers = [];
        this._idle = [];
        this._fallback = true;
      }
      
      this._ready = true;
    }
    
    // ── Job execution ─────────────────────────────────────────────────────────
    
    /**
     * ส่ง job เข้าคิว — คืน Promise ที่ resolve เมื่อ worker ตอบกลับ
     * @param {any} data
     * @returns {Promise<any>}
     */
    execute(data) {
      this._ensureReady();
      if (this._fallback) {
        // S6: ไม่มี worker ใช้งานเท่ากับ worker โดยตรง (จาก inlineFn ที่ translator ส่งมา)
        return Promise.resolve(this._inline ? this._inline(data) : data);
      }
      return new Promise((resolve, reject) => {
        const job = { data, resolve, reject };
        const worker = this._idle.pop();
        if (worker) this._dispatch(worker, job);
        else this._queue.push(job);
      });
    }
    
    /** @private */
    _dispatch(worker, job) {
      this._jobMap.set(worker, job);
      worker.postMessage(job.data);
    }
    
    /** @private */
    _onMessage(worker, e) {
      const job = this._jobMap.get(worker);
      if (!job) return;
      
      this._jobMap.delete(worker);
      job.resolve(e.data);
      
      // ดึง job ถัดไปจากคิว หรือ return worker สู่ idle pool
      const next = this._queue.shift();
      if (next) this._dispatch(worker, next);
      else this._idle.push(worker);
    }
    
    /** @private */
    _onError(worker, e) {
      // S6: ใน Chrome จริง CSP บล็อก blob worker แบบ async (constructor ไม่ throw)
      // แต่ยิง error event ที่ worker → ต้องสลับเป็นโหมด main-thread ทันที
      // แล้วรีเล่น job ที่ค้างให้จบบนเธรดหลัก ไม่ปล่อยให้การแปลค้างกลางคัน
      console.warn('[WorkerPool] Worker error, switching to main-thread fallback:', (e && e.message) || e);
      this._fallback = true;
      try { worker.terminate && worker.terminate(); } catch (_) { /* noop */ }
      this._workers = this._workers.filter((w) => w !== worker);
      this._idle = this._idle.filter((w) => w !== worker);

      // จบ job ของ worker ที่พังด้วยเส้นทาง inline
      const job = this._jobMap.get(worker);
      this._jobMap.delete(worker);
      this._runInline(job);
      // คิวที่เหลือทั้งหมดจบด้วย inline เช่นกัน
      while (this._queue.length) this._runInline(this._queue.shift());
    }

    /** @private รัน job เดียวบนเธรดหลัก (fallback) */
    _runInline(job) {
      if (!job) return;
      try {
        job.resolve(this._inline ? this._inline(job.data) : job.data);
      } catch (err) {
        job.reject(err);
      }
    }
    
    // ── Cleanup ───────────────────────────────────────────────────────────────
    
    /**
     * ปิด workers ทั้งหมด + revoke blob URL
     * เรียกตอน destroy
     */
    destroy() {
      this._workers.forEach(w => { try { w.terminate(); } catch (e) {} });
      
      if (this._blobUrl) {
        try { URL.revokeObjectURL(this._blobUrl); } catch (e) {}
        this._blobUrl = null;
      }
      
      this._workers = [];
      this._idle = [];
      this._queue = [];
      this._jobMap.clear();
      this._ready = false;
    }
  }
  
  M.WorkerPool = WorkerPool;
  
})(window.LangModules = window.LangModules || {});