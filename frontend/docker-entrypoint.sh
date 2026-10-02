#!/bin/sh
set -eu
port="${PORT:-80}"
case "$port" in
  ''|*[!0-9]*)
    echo "PORT inválida: $port" >&2
    exit 1
    ;;
esac
sed "s/__PORT__/${port}/" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
