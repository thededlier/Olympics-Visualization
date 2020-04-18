let COLORS = {
  "Europe": "royalblue",
  "Americas": "crimson",
  "Oceania": "lightseagreen",
  "Asia": "orange",
  "Africa": "lightgrey"
}

Plotly.d3.csv('https://raw.githubusercontent.com/thededlier/Olympics-Visualization/master/dataset/processed_map.csv?token=ADMXMDVZOSMGMWTQUSGRDS26UQ45E', function (err, data) {
  // Create a lookup table to sort and regroup the columns of data,
  // first by year, then by continent:

  let lookup = {};

  function getData(year, continent) {
    let byYear;
    let trace;
    if (!(byYear = lookup[year])) {;
      byYear = lookup[year] = {};
    }
	 // If a container for this year + continent doesn't exist yet,
	 // then create one:
    if (!(trace = byYear[continent])) {
      trace = byYear[continent] = {
        type: 'scattergeo',
        locationmode: 'ISO-3',
        locations: [],
        hoverinfo: 'text',
        text: [],
        marker: {
            size: [],
            sizemode: "area",
            color: COLORS[continent]
        }
      };
    }
    return trace;
  }

  // Go through each row, get the right trace, and append the data:
  for (var i = 0; i < data.length; i++) {
    let datum = data[i];
    let trace = getData(datum['Year'], datum.continent);
    trace.locations.push(datum['country_iso']);
    trace.text.push(datum['region'] + "-" + datum['Medal count'] + "medals");
    trace.marker.size.push(parseInt(datum['Medal count']));
  }

  // Get the group names:
  let years = Object.keys(lookup);
  let firstYear = lookup[years[0]];
  let continents = Object.keys(firstYear);

  // Create the initial trace for each continent:
  var traces = [];
  for (i = 0; i < continents.length; i++) {
    let data = firstYear[continents[i]];

    if (data.locations) {
      traces.push({
        type: 'scattergeo',
        name: continents[i],
        locationmode: 'ISO-3',
        locations: data.locations,
        hoverinfo: 'text',
        text: data.text,
        marker: {
          size: data.marker.size,
          sizemode: 'area',
          color: COLORS[continents[i]]
        }
      });
    }
  }

  // Create a frame for each year. Frames are effectively just
  // traces, except they don't need to contain the *full* trace
  // definition (for example, appearance). The frames just need
  // the parts the traces that change (here, the data).
  let frames = [];
  for (i = 0; i < years.length; i++) {
    frames.push({
      name: years[i],
      data: continents.map(function (continent) {
        return getData(years[i], continent);
      })
    })
  }

  // Now create slider steps, one for each frame. The slider
  // executes a plotly.js API command (here, Plotly.animate).
  // In this example, we'll animate to one of the named frames
  // created in the above loop.
  var sliderSteps = [];
  for (i = 0; i < years.length; i++) {
    sliderSteps.push({
      method: 'animate',
      label: years[i],
      args: [[years[i]], {
        mode: 'immediate',
        transition: {duration: 300},
        frame: {duration: 300, redraw: true},
      }]
    });
  }

  var layout = {
    title_text: "Olympic Medals over the Years<br>(Click legend to toggle traces)",
    show_legend: true,
    height: 800,

    updatemenus: [{
      x: 0,
      y: 0,
      yanchor: 'top',
      xanchor: 'left',
      showactive: false,
      direction: 'left',
      type: 'buttons',
      pad: {t: 87, r: 10},
      buttons: [{
        method: 'animate',
        args: [null, {
          mode: 'immediate',
          fromcurrent: true,
          transition: {duration: 300},
          frame: {duration: 500, redraw: true}
        }],
        label: 'Play'
      }, {
        method: 'animate',
        args: [[null], {
          mode: 'immediate',
          transition: {duration: 0},
          frame: {duration: 0, redraw: true}
        }],
        label: 'Pause'
      }]
    }],

    sliders: [{
      pad: {l: 130, t: 55},
      currentvalue: {
        visible: true,
        prefix: 'Year:',
        xanchor: 'right',
        font: {size: 20, color: '#666'}
      },
      steps: sliderSteps
    }]
  };

  // Create the plot:
  Plotly.newPlot('mapPlot', {
    config: { responsive: true},
    data: traces,
    layout: layout,
    frames: frames,
  });
});
