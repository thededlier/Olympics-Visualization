let COLORS = {
  "Europe": "royalblue",
  "Americas": "crimson",
  "Oceania": "lightseagreen",
  "Asia": "orange",
  "Africa": "lightgrey",
}

let MAP_URL = "https://raw.githubusercontent.com/thededlier/Olympics-Visualization/master/dataset/processed_map.csv";
let GDP_URL = "https://raw.githubusercontent.com/thededlier/Olympics-Visualization/master/dataset/gdp_csv.csv";
let ATHLETE_URL = "https://raw.githubusercontent.com/thededlier/Olympics-Visualization/master/dataset/processed_athlete_data.csv";

function showMedalChart(medalsData, country) {
  let medalLookup = {};

  function getMedalData(year) {
    let byYear;
    let trace;
    if (!(byYear = medalLookup[year])) {
      trace = medalLookup[year] = {};
    }

    trace = medalLookup[year] = {
      values: [],
      labels: ["Gold", "Silver", "Bronze", "None"],
      marker: {
        colors: ["#FFDF00", '#C0C0C0', "#A97142", '#808080'],
      },
      type: 'pie',
      hoverinfo: 'name label percent',
      domain: {
        row: 0,
        column: 0
      },
      name: year
    };
    return trace;
  }

  let initRow = 0;
  let initCol = 0;
  for (var i = 0; i < medalsData.length; i++) {
    let datum = medalsData[i];
    if (datum['country_iso'] == country) {
      let trace = getMedalData(datum['Year']);
      trace.values.push(datum['Gold count']);
      trace.values.push(datum['Silver count']);
      trace.values.push(datum['Bronze count']);
      trace.values.push(datum['None count']);

      if (initCol > 3) {
        initCol = 0;
        initRow += 1;
      }

      trace.domain.row = initRow;
      trace.domain.column = initCol;
      initCol +=1;
    }
  }

  let years = Object.keys(medalLookup);
  let pieChartData = [];

  years.forEach((year) => {
    pieChartData.push(medalLookup[year]);
  });

  let layout = {
    title: 'Distribution of medals for ' + country,
    height: 1400,
    grid: {rows: initRow + 1, columns: 4}
  }

  Plotly.newPlot('pieChart', pieChartData, layout);
}

function showGdpChart(mapData, gdpData, country) {
  let gdpTrace = {
    x: [],
    y: [],
    name: "GDP",
    type: "scatter"
  }

  let medalsTrace = {
    x: [],
    y: [],
    name: "Medals",
    type: "scatter",
    yaxis: 'y2',
  }

  // Set medals trace
  for (var i = 0; i < mapData.length; i++) {
    let datum = mapData[i];
    if (datum['country_iso'] == country) {
        medalsTrace.x.push(datum['Year']);
        medalsTrace.y.push(datum['Medal count']);
    }
  }

  for (var i = 0; i < gdpData.length; i++) {
    let datum = gdpData[i];
    if (datum['Country Code'] == country) {
        gdpTrace.x.push(datum['Year']);
        gdpTrace.y.push(datum['Value']);
    }
  }

  let layout = {
    title: 'GDP vs Medals Won',
    yaxis: {title: 'GDP ($)'},
    yaxis2: {
      title: 'Number of Medals',
      overlaying: 'y',
      side: 'right'
    }
};

  Plotly.newPlot('gdpChart', [gdpTrace, medalsTrace], layout);
}

Plotly.d3.csv(MAP_URL, function (err, mapData) {
  // Create a lookup table to sort and regroup the columns of data first by year, then by continent:
  let lookup = {};

  function getData(year, continent) {
    let byYear;
    let trace;
    if (!(byYear = lookup[year])) {;
      byYear = lookup[year] = {};
    }

	 // If a container for this year + continent doesn't exist yet, then create one:
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
  for (var i = 0; i < mapData.length; i++) {
    let datum = mapData[i];
    let trace = getData(datum['Year'], datum.continent);
    trace.locations.push(datum['country_iso']);
    trace.text.push(datum['region'] + "-" + datum['Medal count'] + "medals");
    trace.marker.size.push(parseInt(datum['Medal count']));
  }

  // Get the group names:
  let years = Object.keys(lookup);
  let firstYear = lookup[years[0]];
  let continents = Object.keys(COLORS);

  // Create the initial trace for each continent:
  var traces = [];
  for (i = 0; i < continents.length; i++) {
    let data = firstYear[continents[i]];

    if (data) {
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
    } else {
      traces.push({
        type: 'scattergeo',
        name: continents[i],
        locationmode: 'ISO-3',
        locations: [],
        hoverinfo: 'text',
        text: [],
        marker: {
          size: [],
          sizemode: 'area',
          color: COLORS[continents[i]]
        }
      });
    }
  }

  // Create a frame for each year
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
    title: "Olympic Medals over the Years<br>(Click country to see more)",
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

    geo: {
      showcountries: true,
      landcolor: "#E5ECF6",
      showlakes: true,
      showland: true
    },

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

  Plotly.d3.csv(GDP_URL, function (err, gdpData) {
    Plotly.d3.csv(ATHLETE_URL, function (err, medalsDataset) {
      let mapPlot = document.getElementById('mapPlot');

      mapPlot.on('plotly_click', function(data) {
        let countryCode = data["points"][0]["data"]["locations"][0]
        showMedalChart(medalsDataset, countryCode);
        showGdpChart(mapData, gdpData, countryCode);
      });
    });
  });
});
