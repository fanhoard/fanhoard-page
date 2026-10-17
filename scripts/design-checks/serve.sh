#!/bin/sh
# เริ่ม/หยุดเซิร์ฟเวอร์ทดสอบ CSP ด้วย PID ไฟล์ (ไม่ค้นจากข้อความบรรทัดคำสั่ง จึงไม่ฆ่าตัวเอง)
# usage: sh scripts/design-checks/serve.sh start|stop|status   (พอร์ต 8792)
D="$(cd "$(dirname "$0")" && pwd)"; PIDF=/tmp/fanhoard-csp.pid
case "$1" in
  start) "$0" stop >/dev/null 2>&1; python3 "$D/serve_csp.py" 8792 >/tmp/fanhoard-csp.log 2>&1 & echo $! > $PIDF; sleep 1.2
         echo "started pid $(cat $PIDF)";;
  stop)  if [ -f $PIDF ]; then kill "$(cat $PIDF)" 2>/dev/null; rm -f $PIDF; echo stopped; else echo "not running"; fi;;
  status) if [ -f $PIDF ] && kill -0 "$(cat $PIDF)" 2>/dev/null; then echo "running pid $(cat $PIDF)"; else echo "not running"; fi;;
  *) echo "usage: $0 start|stop|status"; exit 2;;
esac
