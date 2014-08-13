var currSelectedRowText = "EURUSD";
var eqSelectedRow = "CAC 40";

$(document).ready(function () {



    //////////////////////////////////////////////
    /*-------------- EQUITY GRID ---------------*/

    //  Data Source For the Equity Grid
    var eqUrl = "https://query.yahooapis.com/v1/public/yql?q=select%20Name%2CSymbol%2CDaysLow%2CDaysHigh%2CChangeinPercent%2CChange%2CLastTradePriceOnly%20%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22%5EFCHI%22%2C%22%5EGDAXI%22%2C%22FTSEMIB.MI%22%2C%22%5EFTSE%22%2C%20%22%5EGSPC%22%2C%20%22%5EIBEX%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&";


    var eqData = new kendo.data.DataSource({
        transport: {
            read: {
                url: eqUrl,
                dataType: "jsonp"

            }
        },
        schema: {
            parse: function (data) {
                if (data.query.results != null)
                    return data.query.results.quote;
                else
                    return [];
            },
            data: function (data) {
                $.each(data, function () {
                    if (this.Change != null) {
                        if (this.Change.indexOf("-") > -1) {
                            this.Change += " <i class='fa fa-caret-down fa-1.5x' style='color:red'></i>\t" + this.ChangeinPercent;
                        } else {
                            this.Change += " <i class='fa fa-caret-up fa-1.5x' style='color:green'></i>\t" + this.ChangeinPercent;

                        }
                    }
                });

                return (data);
            }
        }

    });

    var eqData;
    //$("#eqGrid").empty();
    $("#eqGrid").kendoGrid({
        columns: [
            {
                title: "Name",
                field: "Name"
            }, {
                title: "Price",
                field: "LastTradePriceOnly"
            },
        {
            title: "Net Change / %",
            field: "Change",
            encoded: false,
            attributes: {
                style: "text-align: right"
            }
        },
        {
            title: "High",
            field: "DaysHigh"
        }, {
            title: "Low",
            field: "DaysLow"
        }

        ],
        selectable: true,
        change: function (e) {
            var t = this.dataItem(this.select()[0]);
            $("#eqName").text(t.Name);
            var d = new Date();
            $("#eqTimeStamp").text("Last Update: " + d.toLocaleString());

            if (this.select().length > 0 && t.Name != eqSelectedRow) {
                createEqChart(t);

                eqSelectedRow = t.Name;
            }

            console.log("Data Updated");
        },
        dataSource: eqData,
        dataBinding: function (e) {

            if (eqData.data().length == 0) { e.preventDefault; eqData.read(); console.error("Missed Connection"); }
        },
        dataBound: function () {

            var eqLookUp = { "CAC 40": 1, "DAX": 2, "FTSE MIB": 3, "FTSE 100": 4, "S&P 500": 5, "^IBEX": 6 }

            var grid1 = $("#eqGrid").data("kendoGrid");
            grid1.select("#eqGrid tr:eq(" + eqLookUp[eqSelectedRow] + ")");

            createEqChartJustOnce(this.dataItem(this.select()[0]))
        }
    });


    setInterval(function () {
        updateGraph = false;
        eqData.read();
        currData.read();
    }, 35000);







    //////////////////////////////////////////////
    /*------------ CURRENCY GRID ---------------*/


    //Data Sourse for the currency grid
    var currUrl = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22EURUSD%22%2C%22EURGBP%22%2C%22EURCHF%22%2C%22EURJPY%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";


    var currData = new kendo.data.DataSource({
        transport: {
            read: {
                url: currUrl,
                dataType: "jsonp"
            }
        },
        schema: {
            parse: function (data) {
                return data.query.results.rate;
            }
        }

    });



    $("#currGrid").kendoGrid({
        columns: [
            {
                title: "Name",
                field: "id"
            },
        {
            title: "Rate",
            field: "Rate"
        },
        {
            title: "Date",
            field: "Date"
        },
        {
            field: "Time",
            title: "Time"
        }
        ],
        selectable: true,
        change: function (e) {

            var t = this.dataItem(this.select()[0]).id;
            $("#currName").text(t);
            var d = new Date();
            $("#currTimeStamp").text("Last Update: " + d.toLocaleString());


            if (this.select().length > 0 && $(this.select()[0]).find("td:first").text() != currSelectedRowText) {

                if (currencyData == null) {
                    $.ajax({
                        url: "eurofxref-hist-90d.xml",
                        dataType: "xml",
                        success: function (e) {
                            parse(e);
                            createCurrChart(t);
                        },
                        error: function () { console.error("Error: Something went wrong"); }
                    });
                }
                else {
                    createCurrChart(t);
                }

                currSelectedRowText = $(this.select()[0]).find("td:first").text();
            }
        },
        dataSource: currData,
        dataBound: function (e) {

            var currLookUp = { EURUSD: 1, EURGBP: 2, EURCHF: 3, EURJPY: 4 };


            //var x = e.sender.select();
            //if (x.length == 0) {
            var grid1 = $("#currGrid").data("kendoGrid");
            grid1.select("#currGrid tr:eq(" + currLookUp[currSelectedRowText] + ")");
            createCurrChartJustOnce(this.dataItem(this.select()[0]).id);

            //}
        }


    });


});


////////////////////////////////////////////
/*------------- EQUITY CHART -------------*/


function createEqChart(o) {

    var urlFormat = "https://query.yahooapis.com/v1/public/yql?q=select * from yahoo.finance.historicaldata where symbol = '{0}' and startDate = '{1}' and endDate = '{2}'&format=json&env=store://datatables.org/alltableswithkeys";

    /* Strings for the URL */
    var d1 = new Date();
    var stringDate1 = d1.toISOString();
    stringDate1 = stringDate1.slice(0, stringDate1.indexOf("T"));
    var d2 = new Date();
    d2.setMonth(d1.getMonth() - 12);
    var stringDate2 = d2.toISOString();
    stringDate2 = stringDate2.slice(0, stringDate2.indexOf("T"));

    /*3 months before stringDate1*/
    var d3 = new Date();
    d3.setMonth(d1.getMonth() - 3);
    var stringDate3 = d3.toISOString();
    stringDate3 = stringDate3.slice(0, stringDate2.indexOf("T"));
    /*---------------------------*/
    var url = urlFormat.format(o.Symbol, stringDate2, stringDate1)

    var d = new kendo.data.DataSource({
        transport: {
            read: {
                url: url,
                dataType: "jsonp"
            }
        },
        schema: {
            parse: function (data) {
                return data.query.results.quote.reverse();
            }
        }
    });



    $("#chart").empty();
    $("#chart").kendoStockChart({
        dataSource: d,
        //seriesDefaults: {
        //    type: "line",
        //    style: "smooth"

        //},
        dateField: "Date",
        categoryAxis: {
            //    majorGridLines: {
            //        visible: false
            //    },
            //    field:"Date",
            //    baseUnit: "fit",
            //    maxDateGroups: 5
            baseUnitStep: "fit",
            autoBaseUnitSteps: {
                days: [1]
            }
        },
        tooltip: {
            visible: true,
            template: kendo.template("#=dataItem.Date# <br />Price: #=value# ")
        },
        navigator: {
            series: {
                missingValues: "interpolate",
                type: "area",
                field: "Close"
            },
            select: {
                from: stringDate3,
                to: stringDate1
            }
        },
        series: [{
            type: "line",
            field: "Close",
            style: "smooth",
            width: 1,
            markers: {
                size: 2
            }
        }],
    });
}





////////////////////////////////////////////
/*------------- CURRENCY CHART -------------*/
var eurusd = new Array();
var eurgbp = new Array();
var eurjpy = new Array();
var eurchf = new Array();
var currencyData;

function parse(d) {

    var t = $(d).find("Cube").find("Cube");
    $.each(t, function (i, time) {

        var d = $(time).find("Cube");
        $.each(d, function (j, curr) {

            if ($(curr).attr("currency") == "USD") {
                eurusd.push({
                    time: $(time).attr("time"),
                    rate: $(curr).attr("rate")
                })
            } else if ($(curr).attr("currency") == "CHF") {
                eurchf.push({
                    time: $(time).attr("time"),
                    rate: $(curr).attr("rate")
                })
            } else if ($(curr).attr("currency") == "GBP") {
                eurgbp.push({
                    time: $(time).attr("time"),
                    rate: $(curr).attr("rate")
                })
            } else if ($(curr).attr("currency") == "JPY") {
                eurjpy.push({
                    time: $(time).attr("time"),
                    rate: $(curr).attr("rate")
                })
            }
        });
    });

    currencyData = {
        EURUSD: eurusd,
        EURGBP: eurgbp,
        EURJPY: eurjpy,
        EURCHF: eurchf
    };


}



function createCurrChart(o) {

    $("#currChart").empty();

    $("#currChart").kendoStockChart({
        dataSource: currencyData[o],
        seriesDefaults: {
            type: "area",
            area: {
                line: {
                    style: "smooth"
                }
            }
        },
        dateField: "time",
        categoryAxis: {
            majorGridLines: {
                visible: false
            }
        },
        tooltip: {
            visible: true,
            template: kendo.template("#=dataItem.time# <br />Value: #=value# ")
        },
        legend: {
            visible: false
        }, navigator: {
            series: {
                missingValues: "interpolate",
                type: "area",
                field: "rate"
            },
            select: {
                from: "2014/07/05",
                to: "2014/08/01"
            }
        },
        series: [{
            type: "line",
            field: "rate",
            style: "smooth",
            markers: {
                size: 3
            }
        }]
    });

}


//--------- Utility


if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
              ? args[number]
              : match
            ;
        });
    };
}


var createCurrChartJustOnce = (function () {
    var executed = false;
    return function (o) {
        if (!executed) {
            executed = true;
            $.ajax({
                url: "eurofxref-hist-90d.xml",
                dataType: "xml",
                success: function (e) {
                    parse(e);
                    createCurrChart(o);
                },
                error: function () { alert("Error: Something went wrong"); }
            });
        }
    };
})();


var createEqChartJustOnce = (function () {
    var executed = false;
    return function (o) {
        if (!executed) {
            executed = true;

            createEqChart(o);

        }
    };
})();