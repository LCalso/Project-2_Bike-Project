require.config({
  paths: {
    jquery: "//cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min",
    bootstrap: "//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min",
    d3: "//cdnjs.cloudflare.com/ajax/libs/d3/3.4.13/d3.min",
    'd3-tip': "//cdnjs.cloudflare.com/ajax/libs/d3-tip/0.7.1/d3-tip.min",
    topojson: "//cdnjs.cloudflare.com/ajax/libs/topojson/2.2.0/topojson.min",
    moment: "//cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment"
  },
  shim: {
    bootstrap: ['jquery']
  }
});