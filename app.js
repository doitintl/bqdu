/**
 * Created by vadim on 16/4/15.
 */

// Google Analytics
(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
ga('create', 'UA-39701609-5', 'auto');
ga('send', 'pageview');

google.load("visualization", "1", {packages: ["treemap"]});

function showFullTooltip(row, size, value) {
    return '<div style="background:#fd9; padding:10px; border-style:solid; border-color:white">' + 'Size: ' + numberWithCommas(Math.round(chartData.getValue(row, 2)/1024/1024/1024)) + ' GB' + '<br> Row: ' + numberWithCommas(Math.round(chartData.getValue(row, 3)/1000000)) + 'M' + '</div>';
}

// number formatting
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// User Submitted Variables
var project_id = 'doit-intl.com:ezrakhovichg2';
var client_id = '968052747331-6rhnplku61s0aokfjdsil04v7c5clck1.apps.googleusercontent.com';
var email;

var config = {
    'client_id': client_id,
    'scope': 'https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/userinfo.email'
};

function getTableData(projectId, success, failed) {
    var projectId;
    var data = [['table', 'dataset', 'size', 'rows'], [projectId, null, 0, 0]];
    var index = 2;
    var dataset_index = 0;
    var dsSize = 0;
    var dsRows = 0;
    var totalSize = 0; // total data in project
    var totalRows = 0; // total rows in project
    var ntables = 0; // total number of tables in project
    var datasets;
    var tableRes = 0;
    var tableCalls = 0;

    function onGetTableInfo(response) {
        tableRes++;
        var dataset = this;
        var tableRows = parseInt(response.numRows) / 1000000; // get number of rows in millions
        var tableSize = parseInt(response.numBytes) / 1024 / 1024 / 1024; // get size of the table in GB
        if (isNaN(tableSize)) {
            tableSize = 0;
        }

        data[index] = [{
            v: response.result.id,
            f: response.tableReference.tableId
        }, dataset.datasetReference.datasetId, parseInt(response.numBytes), parseInt(response.numRows)];
        index++;

        dsSize = dsSize + tableSize;
        dsRows = dsRows + tableRows;

        totalSize = totalSize + tableSize; // calculate total size of all tables in all datasets
        totalRows = totalRows + tableRows; // calculate total rows of all tables in all datasets
        if (tableCalls == tableRes) {
            success(data)
        }
    }

    function onGetTables(response) {
        var dataset = this;
        var tables = response.tables;

        // if tables exist in dataset, get tableSize & tableRows from each table
        if (tables) {
            dataset_index++;

            tables.forEach(function (table) {
                tableCalls++;
                current_table = table;
                var request = gapi.client.bigquery.tables.get({
                    projectId: projectId,
                    datasetId: dataset.datasetReference.datasetId,
                    tableId: table.tableReference.tableId
                });
                request.execute(onGetTableInfo.bind(dataset));
            });
            data[index] = [dataset.datasetReference.datasetId, projectId, dsSize, dsRows];
            index++;

            dsSize = 0;
        }
    }

    function onGetDatasets(response) {
        var datasets = response.datasets;
        if (!datasets) return;

        // Fetching all tables from each dataset
        datasets.forEach(function (dataset) {
            if (!dataset) return;
            //current_dataset = dataset;
            var request = gapi.client.bigquery.tables.list({
                projectId: projectId, datasetId: dataset.datasetReference.datasetId, maxResults: 500
            });

            request.execute(onGetTables.bind(dataset));

            //ntables = ntables + tables.tables.length; // not sure I still need it

        });
    }

    // Fetching all datasets for given project
    var request = gapi.client.bigquery.datasets.list({projectId: projectId}, {maxResults: 500});
    request.execute(onGetDatasets);
}

var app = angular.module('app', ['ngMaterial']);

app.controller('AppCtrl', ['$scope', '$mdSidenav', '$mdDialog', '$timeout', function ($scope, $mdSidenav, $mdDialog, $timeout) {

    $scope.auth = function () {
        gapi.auth.authorize(config, function () {
            gapi.client.load('bigquery', 'v2');
            $('#client_initiated').html('BigQuery client initiated');

            gapi.client.load('oauth2', 'v2', function () {
                gapi.client.oauth2.userinfo.get()
                    .execute(function (resp) {
                        // Shows user email
                        $timeout(function () {
                            $scope.email = resp.email;
                        });
                        getProjects();
                    });
            });
        });
    };

    function getProjects() {
        //var projectList = [];
        index = 0;
        var request = gapi.client.bigquery.projects.list({maxResults: 500});
        request.execute(function (response) {
            $scope.projectList = response.projects;
        });
    }

    $scope.toggleSidenav = function (menuId) {
        $mdSidenav(menuId).toggle();
    };

    $scope.analyze = function () {

        $scope.showProgress = true;

        getTableData($scope.projectId, drawChart, badluck);

        function badluck(e) {
            $scope.showProgress = false;
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.body))
                    .title('Aarrgh! Something went wrong...')
                    .content('There was an error fetching your BigQuery datasets. Make sure you are using correct ProjectID or maybe just bad luck')
                    .ok('OK. Let me try again!')
            );
            $scope.projectId = "";
        }

        function drawChart(data) {
            //console.log('draw chart: %O', data);
            window.rowdata = data;
            $timeout(function () {
                $scope.showProgress = false;
            });

            chartData = google.visualization.arrayToDataTable(data);
            tree = new google.visualization.TreeMap(document.getElementById('chart_div'));

            tree.draw(chartData, {
                minColor: '#BBDEFB',
                midColor: '#42A5F5',
                maxColor: '#1976D2',
                headerHeight: 15,
                fontColor: 'white',
                fontSize: 14,
                showScale: false,
                maxDepth: 1,
                showTooltips: true,
                generateTooltip: showFullTooltip

            })

        }
    };
}

])
;
