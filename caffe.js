var Caffe = function(filename, interval) {
  this.filename = filename;
  this.interval = interval;
}

Caffe.prototype.get_data = function(data, re) {
  var match, result = [];
  while (match = re.exec(data)) {
    result.push(match[1]);
  }
  return result;
};

Caffe.prototype.prepare_data = function(data) {
  var train_iter = this.get_data(data, new RegExp('Iteration ([0-9]+) ', 'g'));
  var train_loss = this.get_data(data, new RegExp(', loss = ([0-9.e\-]+)', 'g'));
  var test_iter  = this.get_data(data, new RegExp('Iteration ([0-9]+), Testing net', 'g'));
  var test_loss  = this.get_data(data, new RegExp('Test.*: Loss = ([0-9.e\-]+)', 'g'));

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

Caffe.prototype.draw_chart = function(data) {

  var chart_data = new google.visualization.DataTable();
  chart_data.addColumn('number', 'Iteration');
  chart_data.addColumn('number', 'Train');
  chart_data.addColumn('number', 'Test');
  chart_data.addRows(this.prepare_data(data));

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
    }
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart'));
  chart.draw(chart_data, chart_options);

};

Caffe.prototype.read_file = function() {
  var self = this;
  $.get(this.filename, function(data) {
    self.draw_chart(data);
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
      interval = parseInt($("#interval").val()) * 1000;
      caffe = new Caffe(filename, interval);
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


