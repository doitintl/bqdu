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
    var tableName = chartData.getValue(row, 0);
    //console.log(tableName);
        if (tableName.indexOf(".")!=-1)
        {
            return '<div style="background:#fd9; padding:10px; border-style:solid; border-color:white">' + '<u>Identity: ' + tableName.split(".")[1] + '</u><br>' + 'Size: ' + numberWithCommas(Math.round(chartData.getValue(row, 2))) + ' GB' + '<br> Row: ' + numberWithCommas(Math.round(chartData.getValue(row, 3))) + 'M' + '</div>'
        }
        else {
            return '<div style="background:#fd9; padding:10px; border-style:solid; border-color:white">' + '<u>Identity: ' + tableName + '</u><br>' + 'Size: ' + numberWithCommas(Math.round(chartData.getValue(row, 2))) + ' GB' + '<br> Row: ' + numberWithCommas(Math.round(chartData.getValue(row, 3))) + 'M' + '</div>'
        }
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

var app = angular.module('app', ['ngMaterial']);

app.controller('AppCtrl', ['$scope', '$mdSidenav', '$mdDialog', '$timeout', '$q', function ($scope, $mdSidenav, $mdDialog, $timeout, $q) {

    $scope.auth = function () {
        gapi.auth.authorize(config, function () {
            gapi.client.load('bigquery', 'v2');
            $('#client_initiated').html('BigQuery client initiated');

            gapi.client.load('oauth2', 'v2', function () {
                gapi.client.oauth2.userinfo.get()
                    .execute(function (resp) {
                        // Shows user email
                        $timeout(function () {
                            $scope.User = true;
                            $scope.name = resp.name;
                            $scope.picture = resp.picture;
                            $scope.email = resp.email;
                            $scope.projectMsg = "Fetching your projects..."
                        });
                        getProjects();
                    });
            });
        });
    };

    function getProjects() {
        var promises = [];
        var request = gapi.client.bigquery.projects.list({maxResults: 500, fields:"projects/id"});
        request.execute(function (response) {

            var myProjects = [];

            for (var p = 0; p < response.projects.length; p++)
            {
                var request = gapi.client.bigquery.datasets.list({projectId: response.projects[p].id});

                promises.push(doReq(request, response.projects[p]))

                function doReq(req, proj)
                {
                    var d = $q.defer();

                    request.execute(function(dsResponse) {
                        try {
                            if (dsResponse.result.datasets.length != 0)
                            {
                                myProjects.push(proj);
                            }
                        } catch(e) {}
                        d.resolve();
                    });
                        return d.promise;
                }
            }

            $q.all(promises).then(function(){
                $timeout(function () {
                    //console.log(myProjects);
                    $scope.projectList = myProjects;
                    $scope.projectMsg = "Please select Project ID..."});

            });
        });
    }

    function getTableData(projectId, success, failed) {
        var data = [['table', 'dataset', 'size', 'rows'], [projectId, null, 0, 0]];

        function getTableInfo (projectId, dataset, table)
        {
            var d = $q.defer();
            var request = gapi.client.bigquery.tables.get(
                {
                    projectId: projectId,
                    datasetId: dataset.datasetReference.datasetId,
                    tableId: table.tableReference.tableId
                });
            request.execute(function (response)
            {
                var tableRows = parseInt(response.numRows) / 1000000; // get number of rows in millions
                var tableSize = parseInt(response.numBytes) / 1024 / 1024 / 1024; // get size of the table in GB
                if (isNaN(tableSize)) {
                    tableSize = 0;
                }

                data.push([{
                    v: response.result.id,
                    f: response.tableReference.tableId}, dataset.datasetReference.datasetId, tableSize, tableRows]);

                d.resolve({size: tableSize, rows: tableRows});

            });
            return d.promise;
        }

        function getTables (projectId, dataset, tables) {
            var d = $q.defer();
            var promises = [];

            var dsSize = 0;
            var dsRows = 0;

            // if tables exist in dataset, get tableSize & tableRows from each table
            if (tables)
            {

                tables.forEach(function (table) {

                    var p = getTableInfo(projectId, dataset, table)
                    .then(function (res){
                        dsSize+=res.size;
                        dsRows+=res.rows;
                    });
                    promises.push(p);
                });
                $q.all(promises).then(function (){
                    d.resolve({size:dsSize, rows:dsRows});
                });
            } else {
                d.resolve();
                }
            return d.promise;
        }

        function onEachDataset(dataset)
        {
            var d = $q.defer();

            if (!dataset) return;
            //current_dataset = dataset;
            var request = gapi.client.bigquery.tables.list({
                projectId: projectId, datasetId: dataset.datasetReference.datasetId, maxResults: 500
            });

            request.execute(function (res) {
                getTables(projectId, dataset, res.tables).then(function (result){
                    if (result) {
                        data.push([dataset.datasetReference.datasetId, projectId, result.size, result.rows]);
                        console.log(data.length);

                    } else
                    {
                        result = {size:0, rows:0};
                    }
                    d.resolve(result);
                });
            });
                    return d.promise;
        }

        function onGetDatasets(response) {

            var d = $q.defer();
            var promises = [];

            var totalSize = 0;
            var totalRows = 0;

            var datasets = response.datasets;
            if (!datasets) return;

            // Fetching all tables from each dataset
            datasets.forEach(function (dataset){
                promises.push(onEachDataset(dataset));
            });
                $q.all(promises).then(function (globalSize){
                    globalSize.forEach(function (size)
                    {
                        totalSize+=size.size;
                        totalRows+=size.rows;
                    });
                    data[1][2] = totalSize;
                    data[1][3] = totalRows;
                    d.resolve(data);
                });

            return d.promise;
        }

        // Fetching all datasets for given project
        var request = gapi.client.bigquery.datasets.list({projectId: projectId}, {maxResults: 500});
        request.execute(function (res){
            onGetDatasets(res).then(success);
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

        window.drawChart = drawChart;

        function drawChart(data) {
            console.log('draw chart: %O', data);
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
                fontSize: 12,
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
