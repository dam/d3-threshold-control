(function () {
  d3.threshold_control = function(options) {
    var container_selector,
        x_scale = d3.scale.linear(),
        y_scale = d3.scale.linear(),
        dispatch = d3.dispatch('threshold'),
        x_label_f,
        y_label_f,
        orientation, //NOTE: defined by the first y or x assignement
        threshold_group,
        threshold_line,
        threshold,
        label,
        marker,
        data = [],
        follow_zoom = false; //NOTE: waiting at least x and y attributes 
        
    var config = {
      lt_margin: 10,
      rb_margin: 10,
      dx_label: -10,
      dy_label: -5,
      marker: false,
      //NOTE: comparator is a function that set the 'breaking threshold' rule for a data
      //      In this case, comparator will return by default the data than strictly exceed the threshold
      comparator: function(x, y) { return x > y; }
    }; 

    options = d3.map(options);
    options.forEach(function(key, val) {
      config[key] = val;
    });

    //NOTE: utilitary methods
    function inDomain(datum, orientation) {
      var scale = x_scale;
      var opposite_orientation = 'x';
      if(orientation === 'x') { scale = y_scale; opposite_orientation = 'y'; }
  
      return (datum[opposite_orientation] >= scale.domain()[0] && datum[opposite_orientation] <= scale.domain()[1]);
    };

    //NOTE: factory function
  	function threshold_control(g, keep_threshold_value) {
      keep_threshold_value = keep_threshold_value || false;
      container_selector = container_selector || ('#' + g.node().parentNode.id);
  	  if(!orientation) { orientation = 'y'; }

      var min_y_scale = y_scale.range()[0],
          max_y_scale = y_scale.range()[1],
          min_x_scale = x_scale.range()[0],
          max_x_scale = x_scale.range()[1],
          y_line_ref,
          x_line_ref; 

      //NOTE: callback functions
      var dragCallback = function() {
        var transform, new_text; 

        if(orientation === 'y') { 
          if(d3.event.y >= max_y_scale && d3.event.y <= min_y_scale) {
            transform = 'translate(0,' + (d3.event.y - y_line_ref) + ')';  
            threshold = y_scale.invert(d3.event.y);
            new_text = y_label_f(threshold);
          } else { return; }
        } 
        else { 
          if(d3.event.x >= min_x_scale && d3.event.x <= max_x_scale) {
            transform = 'translate(' + (d3.event.x - x_line_ref) + ',0)';  
            threshold = x_scale.invert(d3.event.x);
            new_text = x_label_f(threshold);
          } else { return; }
        }

        threshold_line.attr('transform', transform); 
        label.attr('transform', transform).text(new_text);
        marker.attr('transform', transform);
      }; 

      var dragStartCallback = function() {
        threshold_group.style('opacity', 1);
      };

      var dragEndCallback = function() {
        threshold_group.style('opacity', 0.6);

        var returned_data = {};
        var out_of_threshold_data;  

        out_of_threshold_data = data.filter(function(datum) {
          if(follow_zoom) { return config.comparator(datum[orientation], threshold) && inDomain(datum, orientation); } 
          else { return config.comparator(datum[orientation], threshold); }
        });

        returned_data.threshold = threshold;
        returned_data.x_domain = x_scale.domain();
        returned_data.y_domain = y_scale.domain();
        returned_data.hits = out_of_threshold_data;

        if(follow_zoom) { returned_data.total = data.filter(function(datum) { return inDomain(datum, orientation); }).length; }
        else { returned_data.total = data.length; }

        dispatch.threshold(returned_data);
      };

      //NOTE: drawing section
  	  g.each(function() {
        var drag, default_label_text, path_drawing_data, x1, y1, x2, y1, cursor, dx_label, dy_label;
        
        threshold_group = d3.select(this).attr('class', 'threshold-control');
                            
        if(orientation === 'y') {
          x1 = min_x_scale - config.lt_margin;
          x2 = max_x_scale + config.rb_margin;
          dx_label = config.dx_label;

          if(keep_threshold_value && threshold) { 
            y_line_ref = y1 = y2 = y_scale(threshold); 
            dy_label = y1 + config.dy_label;
          } 
          else { 
            y_line_ref = y1 = y2 = max_y_scale; 
            dy_label = config.dy_label;
          }

          threshold_line = threshold_group.append("line")
                             .attr('class', 'threshold-control-line')
                             .attr("x1", x1)
                             .attr("y1", y1)
                             .attr("x2", x2)
                             .attr("y2", y2);

          if(!keep_threshold_value || !threshold) { threshold = y_scale.domain()[1]; }

          default_label_text = y_label_f(threshold);
          //NOTE: marker drawing to grab the line easier
          path_drawing_data = 'M' + x2 + ',' + y2 + ' L' + (x2 + 20) + ',' + y2 + 
            ' L' + (x2 + 20) + ',' + (y2 + 8) + 
            ' L' + (x2 + 8) + ',' + (y2 + 8) + ' Z';
          cursor = 'ns-resize';
        } else {
          y1 = min_y_scale - config.lt_margin;
          y2 = max_y_scale + config.rb_margin;
          dy_label = config.dy_label; 

          if(keep_threshold_value && threshold) { 
            x_line_ref = x1 = x2 = x_scale(threshold); 
            dx_label = x1 + config.dx_label;
          } 
          else { 
            x_line_ref = x1 = x2 = min_x_scale; 
            dx_label = config.dx_label;
          }

          threshold_line = threshold_group.append("line")
                             .attr('class', 'threshold-control-line')
                             .attr("x1", x1)
                             .attr("y1", y1)
                             .attr("x2", x2)
                             .attr("y2", y2);

          if(!keep_threshold_value || !threshold) { threshold = x_scale.domain()[0]; }

          default_label_text = x_label_f(threshold);
          //NOTE: marker drawing to grab the line easier
          path_drawing_data = 'M' + x1 + ',' + y1 + ' L' + x1 + ',' + (y1 + 20) + 
            ' L' + (x1 + 8) + ',' + (y1 + 20) + 
            ' L' + (x1 + 8) + ',' + (y1 + 8) + ' Z';
          cursor = 'ew-resize';
        }
          
        label = threshold_group.append("text")
                  .attr("dx", dx_label)
                  .attr("dy", dy_label)
                  .attr('class', 'threshold-control-label')
                  .text(default_label_text);
        
        marker = threshold_group.append('path')
                   .attr('class', 'threshold-control-marker')
                   .attr('d', path_drawing_data);

        threshold_group.style('cursor', cursor)
          .style('opacity', 0.6);

        drag = d3.behavior.drag()
          .on("drag", dragCallback)
          .on('dragstart', dragStartCallback)
          .on('dragend', dragEndCallback);

        threshold_group.call(drag);
      });
  	};

    //NOTE: redraw update the threshold line in function of reassigns values of y_scale or x_scale
    //      the previous threshold value can be keep or reassigned to the higher value of the scale
    threshold_control.redraw = function(keep_threshold_value) {
      if(container_selector) {
        d3.select(container_selector)
          .append("g")
          .call(threshold_control, keep_threshold_value);
      }
    };

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

    threshold_control.followZoom = function(follow) {
      if (!arguments.length) return follow_zoom;
      follow_zoom = follow;
      return threshold_control;
    };

  	return threshold_control;
  };
})();