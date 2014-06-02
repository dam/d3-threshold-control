(function () {
  d3.threshold_control = function(options) {
    var x_scale = d3.scale.linear(),
        y_scale = d3.scale.linear(),
        dispatch = d3.dispatch('threshold'),
        x_label_f,
        y_label_f,
        orientation, //NOTE: defined by the first y or x assignement
        threshold_line, 
        threshold,
        label,
        data = []; //NOTE: waiting at least x and y attributes 
        
    var config = {
      lt_margin: 10,
      rb_margin: 10,
      dx_label: -10,
      dy_label: -5,
      //NOTE: comparator is a function that set the 'breaking threshold' rule for a data
      //      In this case, comparator will return by default the data than strictly exceed the threshold
      comparator: function(x, y) { return x > y; }
    }; 

    options = d3.map(options);
    options.forEach(function(key, val) {
      config[key] = val;
    });

  	function threshold_control(g) {
      var threshold;
  	  if(!orientation) { orientation = 'y'; }

  	  g.each(function() {
        var g = d3.select(this), drag, default_label_text;
        var min_y_scale = y_scale.range()[0],
            max_y_scale = y_scale.range()[1],
            min_x_scale = x_scale.range()[0],
            max_x_scale = x_scale.range()[1]; 

        g.attr('class', 'threshold-control-container');
        
        if(orientation === 'y') {
          threshold_line = g.append("line")
                        .attr("x1", min_x_scale - config.lt_margin)
                        .attr("y1", max_y_scale)
                        .attr("x2", max_x_scale + config.rb_margin)
                        .attr("y2", max_y_scale);
          default_label_text = y_label_f(y_scale.domain()[1]);
        } else {
          threshold_line = g.append("line")
                        .attr("x1", min_x_scale)
                        .attr("y1", min_y_scale - config.lt_margin)
                        .attr("x2", min_x_scale)
                        .attr("y2", max_y_scale + config.rb_margin);
          default_label_text = x_label_f(x_scale.domain()[0]);
        }
        threshold_line.attr('class', 'threshold-control-line');
        label = g.append("text")
                   .attr("dx", function(){ return config.dx_label; })
                   .attr("dy", function(){ return config.dy_label; })
                   .attr('class', 'threshold-control-label')
                   .text(default_label_text);
        
        drag = d3.behavior.drag()
          .on("drag", function(d,i) {
            var transform, new_text; 
      
            if(orientation === 'y') { 
              if(d3.event.y >= max_y_scale && d3.event.y <= min_y_scale) {
                transform = 'translate(0,' + d3.event.y + ')';  
                threshold = y_scale.invert(d3.event.y);
                new_text = y_label_f(threshold);
              } else { return; }
            } 
            else { 
              if(d3.event.x >= min_x_scale && d3.event.x <= max_x_scale) {
                transform = 'translate(' + d3.event.x + ',0)';  
                threshold = x_scale.invert(d3.event.x);
                new_text = x_label_f(threshold);
              } else { return; }
            }

            threshold_line.attr('transform', transform); 
            label.attr('transform', transform).text(new_text);
          })
          .on('dragend', function() {
            var returned_data = {};
            var out_of_threshold_data;  

            out_of_threshold_data = data.filter(function(datum, index) {
              if(config.comparator(datum[orientation], threshold)) {
                datum.index = index;
                return true;
              }
            });

            returned_data.length = data.length;
            returned_data.threshold = threshold;
            returned_data.x_domain = x_scale.domain();
            returned_data.y_domain = y_scale.domain();
            returned_data.hits = out_of_threshold_data;
            
            dispatch.threshold(returned_data);
          });

        threshold_line.call(drag);
      });
  	}

  	//NOTE: Getters/Setters with function chaining
  	threshold_control.x = function(x) {
      if (!arguments.length) return x_scale;
      x_scale = x;
      if(!orientation) { orientation = 'x'; }
      return threshold_control;
    };

    threshold_control.y = function(y) {
      if (!arguments.length) return y_scale;
      y_scale = y;
      if(!orientation) { orientation = 'y'; }
      return threshold_control;
    };

    threshold_control.xLabelFormat = function(x_label_format) {
      if (!arguments.length) return x_label_f;
      x_label_f = x_label_format;
      return threshold_control;
    };

    threshold_control.yLabelFormat = function(y_label_format) {
      if (!arguments.length) return y_label_f;
      y_label_f = y_label_format;
      return threshold_control;
    };

    threshold_control.event = function() {
      return dispatch;
    };

    threshold_control.data = function(values) {
      if (!arguments.length) return data;
      data = values;
      return threshold_control;
    };

  	return threshold_control;
  };
})();