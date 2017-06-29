var Caffe = function(filename, interval, classes) {
  this.filename = filename;
  this.interval = interval;
  this.classes = classes.split(',');
}

Caffe.prototype.get_data_single = function(data, re) {
  var match, result;
  match = re.exec(data);
  return (match != null ? match[1] : null);
}

Caffe.prototype.get_data = function(data, re) {
  var match, result = [];
  while(match = re.exec(data)) {
    result.push(match[1]);
  }
  return result;
};

Caffe.prototype.prepare_data_loss = function(data) {
  var train_iter = this.get_data(data, new RegExp('Iteration ([0-9]+) ', 'g'));
  var train_loss = this.get_data(data, new RegExp(', loss = ([0-9.e\-]+)', 'g'));
  var test_iter  = this.get_data(data, new RegExp('Iteration ([0-9]+), Testing net', 'g'));
  var test_loss  = this.get_data(data, new RegExp('Test.*: [Ll]oss = ([0-9.e\-]+)', 'g'));

  var all_data = [];
  var i = 0, j = 0, k = 0;

  while(i < train_iter.length && j < test_iter.length) {
    if(train_iter[i] < test_iter[j]) {
      all_data[k++] = [parseInt(train_iter[i]), parseFloat(train_loss[i]), null];
      i++;
    } else if (train_iter[i] > test_iter[j]) {
      all_data[k++] = [parseInt(test_iter[j]), null, parseFloat(test_loss[j])];
      j++;
    } else {
      all_data[k++] = [parseInt(train_iter[i]), parseFloat(train_loss[i]), parseFloat(test_loss[j])];
      i++;
      j++;
    }
  }
  while(i < train_iter.length) {
    all_data[k++] = [parseInt(train_iter[i]), parseFloat(train_loss[i]), null];
    i++;
  }
  while(j < test_iter.length) {
    all_data[k++] = [parseInt(test_iter[j]), null, parseFloat(test_loss[j])];
    j++;
  }
  return all_data;
}

Caffe.prototype.prepare_data_accuracy = function(data) {
  var i, j;
  var classes = {};
  var all_data = [];
  var row = [];
  var iter = this.get_data(data, new RegExp('Iteration ([0-9]+), Testing net', 'g'));
  var mean = this.get_data(data, new RegExp('Test result: mean, accuracy = ([0-9]\.[0-9]{3})', 'g'));

  for(i = 0; i < this.classes.length; i++) {
    classes[this.classes[i]] = this.get_data(data, new RegExp('Test result: class = ' + this.classes[i] + ', accuracy = ([0-9]\.[0-9]{3})', 'g'));
  }

  for(i = 0; i < iter.length; i++) {
    row = [];
    row[0] = parseInt(iter[i]);
    for(j = 0; j < this.classes.length; j++) {
      row[j+1] = parseFloat(classes[this.classes[j]][i]);
    }
    row[j+1] = parseFloat(mean[i]);
    all_data[i] = row;
  }
  return all_data;
}

Caffe.prototype.draw_chart_loss = function(data) {
  var chart_data = new google.visualization.DataTable();
  chart_data.addColumn('number', 'Iteration');
  chart_data.addColumn('number', 'Train');
  chart_data.addColumn('number', 'Test');
  chart_data.addRows(this.prepare_data_loss(data));

  var formatter = new google.visualization.NumberFormat({
    fractionDigits: 10
  });
  formatter.format(chart_data, 1);
  formatter.format(chart_data, 2);

  var chart_options = {
    height: 400,
    interpolateNulls: true,
    pointSize: 3,
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal',
      keepInBounds: true
    },
    hAxis: {
      title: 'Iteration'
    },
    vAxis: {
      title: 'Loss'
    }
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart-loss'));
  chart.draw(chart_data, chart_options);

};

Caffe.prototype.draw_chart_accuracy = function(data) {
  var chart_data = new google.visualization.DataTable();
  chart_data.addColumn('number', 'Iteration');
  for(var i = 0; i < this.classes.length; i++) {
    var label = this.get_data_single(data, new RegExp('Label for class ' + this.classes[i] + ' = (.+)'));
    label != null ? chart_data.addColumn('number', 'Class ' + label) : chart_data.addColumn('number', 'Class ' + this.classes[i]);
  }
  chart_data.addColumn('number', 'Mean');
  chart_data.addRows(this.prepare_data_accuracy(data));

  var formatter = new google.visualization.NumberFormat({
    fractionDigits: 10
  });
  for(var i = 1; i < this.classes.length + 2; i++) {
    formatter.format(chart_data, i);
  }

  var chart_options = {
    height: 400,
    interpolateNulls: true,
    pointSize: 3,
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal',
      keepInBounds: true
    },
    hAxis: {
      title: 'Iteration'
    },
    vAxis: {
      title: 'Accuracy'
    }
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart-accuracy'));
  chart.draw(chart_data, chart_options);

};

Caffe.prototype.read_file = function() {
  var self = this;
  $.get(this.filename, function(data) {
    self.draw_chart_loss(data);
    self.draw_chart_accuracy(data);
    self.timeout = setTimeout(function() {
      self.read_file();
    }, self.interval);
  }, 'text');
}

function start() {
  var caffe;
  $('#start-stop').click(function(){
    if(caffe == null) {
      $(this).html('STOP');
      $(this).removeClass('btn-primary');
      $(this).addClass('btn-danger');
      filename = $("#filename").val();
      classes = $("#classes").val();
      interval = parseInt($("#interval").val()) * 1000;
      caffe = new Caffe(filename, interval, classes);
      caffe.read_file();
    } else {
      $(this).html('START');
      $(this).removeClass('btn-danger');
      $(this).addClass('btn-primary');
      clearTimeout(caffe.timeout);
      caffe = null;
    }
  });
}

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(start);


