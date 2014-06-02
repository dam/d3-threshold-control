d3-threshold-control
====================

A d3 plugin to set a threshold line on a graph and get back the data that exceed this threshold


### Usage example

```javascript
//Building the object
thresholdControl = d3.threshold_control(options)
                     .data([...])
                     .y(y)
                     .x(x)
                     .yLabelFormat(y_current_format)
                     .xLabelFormat(x_current_format);
          
//Callback triggered when some data exceed the threshold
thresholdControl.event().on("threshold", thresholdCallback);

//Appending the threshold line to your svg
svg.append("g")
   .call(thresholdControl);
```

### Returned object
On the thresholdCallback, an object like the following is returned:
```javascript
{length: ..., threshold: ..., x_domain: [..., ...], y_domain: [..., ...], hits: [...]}
```
