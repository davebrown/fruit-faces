#!/bin/bash

set -e

case "${1:-}" in
    start|stop|status)
        exec sudo -n systemctl "$1" ff.service
        ;;
    *)
        echo "usage: $0 {start|status|stop}" >&2
        exit 1
        ;;
esac
