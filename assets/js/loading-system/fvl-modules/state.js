// Path:    assets/js/loading-system/fvl-modules/state.js
// Purpose: State tracking, instance/group registry, and event bus for FVL.

(function(window) {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var State = (function() {

    /** @type {Map<string, FVLInstance>} */
    var _instances = new Map();
    /** @type {Map<string, string>} group → instanceId */
    var _groups = new Map();
    /** @type {Map<string, Set<Function>>} event → listeners */
    var _listeners = new Map();

    function addInstance(inst) {
      _instances.set(inst.id, inst);
      if (inst.options && inst.options.group) {
        var existingId = _groups.get(inst.options.group);
        if (existingId && existingId !== inst.id) {
          _emit('group:replace', { oldId: existingId, newId: inst.id, group: inst.options.group });
        }
        _groups.set(inst.options.group, inst.id);
      }
    }

    function removeInstance(id) {
      var inst = _instances.get(id);
      if (inst && inst.options && inst.options.group) {
        var g = inst.options.group;
        if (_groups.get(g) === id) _groups.delete(g);
      }
      _instances.delete(id);
    }

    function getInstance(id) {
      var CONFIG = M.CONFIG;
      var defaultId = (CONFIG && CONFIG.DOM && CONFIG.DOM.DEFAULT_FULLSCREEN_ID) || 'fvl-default-fullscreen';
      if (!id) id = defaultId;
      return _instances.get(id) || null;
    }

    function getAllInstances() { return Array.from(_instances.values()); }
    function getActiveCount() { return _instances.size; }

    function getByGroup(group) {
      var id = _groups.get(group);
      return id ? _instances.get(id) || null : null;
    }

    function getByMode(mode) {
      return getAllInstances().filter(function(i) { return i.mode === mode; });
    }

    function on(event, fn) {
      if (!_listeners.has(event)) _listeners.set(event, new Set());
      _listeners.get(event).add(fn);
      return function() { off(event, fn); };
    }

    function off(event, fn) {
      var s = _listeners.get(event);
      if (s) s.delete(fn);
    }

    function _emit(event, detail) {
      var s = _listeners.get(event);
      if (s) {
        s.forEach(function(fn) {
          try { fn(detail); } catch (e) { console.error('[FVL:state] listener error:', e); }
        });
      }
      try { window.dispatchEvent(new CustomEvent('fvl:' + event, { detail: detail })); }
      catch (e) { console.warn('[FVL:state] event dispatch error:', e); }
    }

    function destroyAll() {
      _instances.forEach(function(inst) { _emit('destroy', { id: inst.id }); });
      _instances.clear();
      _groups.clear();
      _listeners.clear();
    }

    return Object.freeze({
      addInstance: addInstance,
      removeInstance: removeInstance,
      getInstance: getInstance,
      getAllInstances: getAllInstances,
      getAll: getAllInstances,
      getActiveCount: getActiveCount,
      getByGroup: getByGroup,
      getByMode: getByMode,
      on: on,
      off: off,
      emit: _emit,
      destroyAll: destroyAll,
    });
  })();

  M.State = State;
})(typeof window !== 'undefined' ? window : globalThis);
