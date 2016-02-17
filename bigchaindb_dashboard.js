/**
 * Created by ryan on 28.01.16.
 *
 * Default Graphana installation: /usr/share/grafana/
 *
 * Put this file in: /usr/share/grafana/public/dashboards/
 */
var window, document, ARGS, $, jQuery;

const influxdb_host = 'localhost';
const influxdb_port = '8086';

const telegraf_flush_rate = '10';

const search_url = 'http://' + influxdb_host + ':' + influxdb_port + '/';

const db = 'telegraf';
const query_measurements = 'SHOW MEASUREMENTS';
const column_prefix = 'statsd';

const default_interval = '10s';
const url = search_url + 'query?db=' + db + '&q=' + encodeURIComponent(query_measurements);

var dashboard = {
  rows : [],
};

dashboard.title = 'BigchainDB Monitor'

$.ajax({
    url: url,
    type: "GET",
    success: create_layout
});

return dashboard;

function create_layout(data) {
    var validation_mean_columns = filter_columns('validate_transaction', 'mean', data);
    var validation_count_columns = filter_columns('validate_transaction', 'count', data);

    var write_mean_columns = filter_columns('write_transaction', 'mean', data);
    var write_count_columns = filter_columns('write_transaction', 'count', data);

    var block_mean_columns = filter_columns('write_block', 'mean', data);
    var block_count_columns = filter_columns('write_block', 'count', data)

    dashboard.rows.push({
        title: 'Validate Transaction',
        height: '300px',
        panels: [
            {
                id: 1,
                title: 'Transaction Validation Time (ms)',
                type: 'graph',
                span: 6,
                targets: validation_mean_columns.map((x) => {
                    return {
                        measurement: x,
                        query: 'SELECT mean("value") FROM "' + x + '" GROUP BY time(' + default_interval + ') fill(null)',
                        dsType: 'influxdb',
                        resultFormat: 'time_series'
                    }
                })
            },
            {
                id: 2,
                title: 'Transaction Validation Rate',
                type: 'graph',
                span: 6,
                targets: validation_count_columns.map((x) => {
                    return {
                        measurement: x,
                        target: 'SELECT mean("value") FROM "' + x + '" GROUP BY time(' + default_interval + ') fill(null)',
                        dsType: 'influxdb',
                        resultFormat: 'time_series',
                        query: 'SELECT mean("value")/' + telegraf_flush_rate + ' FROM "' + x + '" WHERE $timeFilter GROUP BY time(' + default_interval + ') fill(null)',
                        rawQuery: true
                    }
                })
            }
        ]
    });

    dashboard.rows.push({
        title: 'Write Transaction',
        height: '300px',
        panels: [
            {
                id: 1,
                title: 'Transaction Write Time (ms)',
                type: 'graph',
                span: 6,
                targets: write_mean_columns.map((x) => {
                    return {
                        measurement: x,
                        query: 'SELECT mean("value") FROM "' + x + '" GROUP BY time(' + default_interval + ') fill(null)'
                    }
                })
            },
            {
                id: 2,
                title: 'Transaction Write Rate',
                type: 'graph',
                span: 6,
                targets: write_count_columns.map((x) => {
                    return {
                        measurement: x,
                        target: 'SELECT mean("value") FROM "' + x + '" GROUP BY time(' + default_interval + ') fill(null)',
                        dsType: 'influxdb',
                        resultFormat: 'time_series',
                        query: 'SELECT mean("value")/' + telegraf_flush_rate + ' FROM "' + x + '" WHERE $timeFilter GROUP BY time(' + default_interval + ') fill(null)',
                        rawQuery: true
                    }
                })
            }
        ]
    });


    dashboard.rows.push({
        title: 'Write Block',
        height: '300px',
        panels: [
            {
                id: 1,
                title: 'Block Write Time (ms)',
                type: 'graph',
                span: 6,
                targets: block_mean_columns.map((x) => {
                    return {
                        measurement: x,
                        query: 'SELECT mean("value") FROM "' + x + '" GROUP BY time(' + default_interval + ') fill(null)'
                    }
                })
            },
            {
                id: 2,
                title: 'Block Write Rate',
                type: 'graph',
                span: 6,
                targets: block_count_columns.map((x) => {
                    return {
                        measurement: x,
                        query: 'SELECT mean("value")/'  + telegraf_flush_rate + ' FROM "' + x + '" GROUP BY time(' + default_interval + ') fill(null)'
                    }
                })
            }
        ]
    });
}

function filter_columns(column_type, aggregation, data) {
    return data.results[0].series[0].values
    .filter((x) => {
        t = x[0].split('_');
        return t[0] === column_prefix && t[t.length - 1] === aggregation;
    })
    .map((x) => {
        return x[0];
    })
    .filter((x) => {
        return x.indexOf(column_type) > -1;
    });
}