#  Caffe Monitoring

A simple tool for monitoring caffe training process. Clone this repository into your public_html folder to be able to monitor your network optimisation from a web browser.  Loss and accuracy charts are plotted automatically and updated at a chosen time interval.


### Plotting loss
1. Redirect caffe output to a file: `caffe train -solver=solver.prototxt -weights=VGG_FACE.caffemodel -gpu=0 2>&1 | tee log.txt`
2. Make sure *log.txt* has reading permissions.
3. In the caffe-monitoring directory, create a symbolic link to your *log.txt* file:
`ln -s /path/to/log.txt log.txt`
4. When accessing your public_html page from a web browser, if *log.txt* is listed under caffe-monitoring directory, then you are good to go.
5. Open *caffe.html* and type *log.txt* in the Filename input.
6. Choose polling interval for chart updates (defaults to 60 seconds).
7. Press start button.

### Plotting accuracies

If you would like to also plot test accuracies, you may want to write your own python layer for that. As the caffe-monitoring tool uses regular expressions to fetch data from caffe logs, some rules should be followed when printing your results.

1. To plot individual accuracies for each class of your problem: 
`print "Test result: class = {0}, accuracy = {1}".format(class, '%.3f' % accuracy)`
2. To plot the mean accuracy:
`print "Test result: mean, accuracy = {1}".format(class, '%.3f' % numpy.mean(accuracies))`
3. Do not forget to force the buffer to stdout after the these printing:
`sys.stdout.flush()`
4. In the Classes input, type the classes your would like to plot values to. The list must be comma-separated. Ex: 0,1,2.
5. Press stop button.
6. Press start button.


