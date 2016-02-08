#!/bin/sh -e
connect_db() {
    while ! curl 'http://admin:admin@localhost:3000/'
    do
        echo "$(date) - waiting for Grafana to be ready"
        sleep 5
    done
    curl 'http://admin:admin@localhost:3000/api/datasources' -X POST -H 'Content-Type: application/json;charset=UTF-8' --data-binary '{"name": "influx", "type": "influxdb","url": "http://localhost:8086", "access": "proxy", "isDefault": true, "database": "telegraf", "user": "root", "password":"root"}'
}

connect_db &

chown -R grafana:grafana /var/lib/grafana /var/log/grafana

exec gosu grafana /usr/sbin/grafana-server  \
  --homepath=/usr/share/grafana             \
  --config=/etc/grafana/grafana.ini         \
  cfg:default.paths.data=/var/lib/grafana   \
  cfg:default.paths.logs=/var/log/grafana

