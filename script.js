d3.csv("./data/ind_word_counts_015_trans.csv").then(function(data) {
    // console.log(data);

    //############################# Set up necessary variables #############################// 
    /*
    /////////// ///////////   DEFINE SVG DIM. + CREATE SVG CANVAS  /////////// /////////// 
    */
    const size = {w: 600, h: 600};
    var width = document.querySelector("#chart").clientWidth * 0.9;
    var height = document.querySelector("#chart").clientHeight * 0.9;
    var margin = {top: 40, left: 100, right: 40, bottom: 100};
    // var margin = {top: 20, left: 50, right: 20, bottom: 50};

//     size.w = width;
//     size.h = height;
// // 

    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(responsivefy);
        // .attr("viewBox", `0 0 ${width} ${height}`);


    function responsivefy(svg) {

        console.log("response");

        // get container + svg aspect ratio
        var container = d3.select(svg.node().parentNode),
            width = parseInt(svg.style("width")),
            height = parseInt(svg.style("height")),
            aspect = width / height;

        // console.log(continer)
         // add viewBox and preserveAspectRatio properties,
        // and call resize so that svg resizes on inital page load
        svg.attr("viewBox", "0 0 " + width + " " + height)
            .attr("perserveAspectRatio", "xMinYMid")
            .call(resize);

        // to register multiple listeners for same event type, 
        // you need to add namespace, i.e., 'click.foo'
        // necessary if you call invoke this function for multiple svgs
        // api docs: https://github.com/mbostock/d3/wiki/Selections#on
        d3.select(window).on("resize." + container.attr("id"), resize);

    
         // get width of container and resize svg to fit it
        function resize() {
            var targetWidth = parseInt(container.style("width"));
            svg.attr("width", targetWidth);
            svg.attr("height", Math.round(targetWidth / aspect));
            svg.selectAll("text")
                // .style('font-size', ".8em");

            svg.selectAll("text.axisLabel")
                // .style('font-size', "1.1em");

            // console.log(targetWidth);

        }

    }
    
    

    /*
    /////////// ///////////  FILTER THE DATA  /////////// /////////// 
    */
    // Pattern A data
        var pat_A =  data.filter(function(d) {
            return d.pattern_label === "A";
        });

    // "happy" data
        var happy_data =  data.filter(function(d) {
            return d.emotion_word === "happy";
        });

    // Get total instance counts for each emotion
        var eachInstanceCount = data.map(d => d.instances);


    // Get min instances to set domain
         var eachInstanceStats = {
             minInstances: d3.min(eachInstanceCount, function(d) { return +d; }),
             maxInstances: d3.max(eachInstanceCount, function(d) { return +d; })
         }

    // Get total instance counts for each emotion
        var totalInstanceCounts = d3.nest()
            .key(function (d){ return d.emotion_word; })      
            .rollup(function (leaves){ return d3.sum(leaves, function(d){ return d.instances; }); })
            .entries(data)


    //  Get overall min and max number of instances
        var totalStats = {
            minInstances: d3.min(totalInstanceCounts, function(d) { return +d.value; }),
            maxInstances: d3.max(totalInstanceCounts, function(d) { return +d.value; }),
        }

    /*

    /////////// ///////////  CREATE SCALES  /////////// /////////// 
    */

    // Make x variable scale
    var xScale = d3.scalePoint()
        .domain([...new Set(data.map(function(d){return d.pattern_label}))])
        .range([margin.left, width-margin.right])
        .padding(0.5);

    
    // Reverse emotion words to place in alphabetical order along y axis
    var reverse_emo_words = data.slice().sort((a, b) => d3.descending(a.emotion_word, b.emotion_word));
    var reverse_emo_words = [...new Set(reverse_emo_words.map(function(d){return d.emotion_word}))];


    // Make y variable scale
    var yScale = d3.scalePoint()  
        // .domain(reverse_emo_words)
        // .range([height-margin.bottom, margin.top])
        .domain(["happy"])
        .range([height-margin.bottom, height-margin.bottom-100])
        .padding(0.5);


    // Make r variable scale
    var rScale = d3.scaleSqrt()
        .domain([1, eachInstanceStats.maxInstances])
        .range([1*2.5, eachInstanceStats.maxInstances*2.5]); 

   
    /////////// ///////////  DRAW AXIS LABELS  ///////////  /////////// 

    var xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width/2 - 50)
        .attr("y", height-margin.bottom/4)
        .text("Physiological Patterns*");
    
    // var yAxisLabel = svg.append("text")
    //     .attr("class", "axisLabel")
    //     .attr("transform", "rotate(-90)")
    //     .attr("x",-height/2)
    //     .attr("y", margin.left/4.5)
    //     .text("Emotion Words");   


    /////////// ///////////   DRAW AXES  ///////////  ///////////

    var xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("id", "xAxis")
        .attr("transform", `translate(0, ${height-margin.bottom})`)
        .call(d3.axisBottom().tickPadding(8).scale(xScale));


    var yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("id", "yAxis")
        .attr("transform", `translate(${margin.left}, 0)`) 
        .call(d3.axisLeft().tickPadding(8).scale(yScale))

    
    
    /////////// ///////////   SET UP TOOLTIP  ///////////  ///////////
    // Create a variable called tooltip
    var tooltip = d3.select("#chart")  
        .append("div")                   
        .attr("class", "tooltip")


        
//############################# Data with delay animations #############################// 


/////////// ///////////  PLOT FIRST SET OF DATA  ///////////  /////////// 

// %%%%%%% %%%%%%% %%%%%%%  show:  HAPPY  %%%%%%% %%%%%%% %%%%%%% //

// /// DEFINE HAPPY FUNCTION
function drawHappyPoints() {

    // // Redefine x scale
    xScale.domain([...new Set(data.map(function(d){return d.pattern_label}))])
    xScale.range([margin.left, width-margin.right])
       

    // // Redefine y scale to just include "happy"
    yScale.domain(["happy"])
    yScale.range([height-margin.bottom, height-margin.bottom-100])

    // Plot points

    var happyPoints = svg.selectAll("circle")                
        .data(data.filter(function(d) { return d.emotion_word === "happy" && d.instances > 0.99;}))
    // enter
    happyPoints.enter().append("circle")                           
            .attr("cx", function(d) { return xScale(d.pattern_label); })
            .attr("cy", yScale("happy"))
            .attr("r", 0)
            .attr("fill", "steelblue")
            .attr("stroke", "darkblue")
    // update
    .merge(happyPoints)                                          
        .transition()
        .duration(1000)
        // .delay(1000)
            .attr("cx", function(d) { return xScale(d.pattern_label); })
            .attr("cy", yScale("happy"))
            .attr("r", function(d) { return rScale(d.instances); })
            .attr("fill", "steelblue")
            .attr("stroke", "darkblue")
    // exit
    happyPoints.exit()                
        .transition()
        .duration(1000)
        // .delay(1000)
        .attr("r",0)      
        .remove();    

    
    // Transition to happy axes

    xAxis.transition()             
        .duration(1000)
        // .delay(1000)
        .call(d3.axisBottom().tickPadding(8).scale(xScale));           

    yAxis.transition()              
        .duration(1000)
        // .delay(1000)
        .call(d3.axisLeft().tickPadding(8).scale(yScale));  

    
    /////////// ///////////  ADD SIMPLE TOOLTIP  /////////// ///////////  

    svg.selectAll("circle")
        .on("mouseover", function(d){     

            var cx = +d3.select(this).attr("cx")+20;   
            var cy = +d3.select(this).attr("cy")+10;

            tooltip.style("visibility", "visible")  
                .style("left", cx + "px")
                .style("top", cy + "px")
                .text(d.instances)    
                .text(d3.format(".2f")(d.instances)+ " instances");                  

        }).on("mouseout", function(){
            tooltip.style("visibility", "hidden"); 
        });       


}

setTimeout(function() { drawHappyPoints(); }, 1000);


/////////// /////////// ///////////  TRANSITION TO NEW DATA  ///////////  /////////// /////////// 

    // %%%%%%% %%%%%%% %%%%%%%  show:  PATTERN A  %%%%%%% %%%%%%% %%%%%%% //

// /// DEFINE PAT A FUNCTION
function drawPatAPoints() {

    // Redefine x scale to just include pattern A only
    xScale.domain(["A"])
    xScale.range([margin.left, margin.left+109])

    // Redefine y scale to include all emotion words
    yScale.domain(reverse_emo_words)
    yScale.range([height-margin.bottom, margin.top])


    // Plot new pattern A points

    var patAPoints = svg.selectAll("circle")                
        .data(data.filter(function(d) { return d.pattern_label === "A" && d.instances > 0.99;}))
    // enter
        patAPoints.enter().append("circle")                           
            .attr("cx", xScale("A"))
            .attr("cy", function(d) { return yScale(d.emotion_word); })
            .attr("r", 0)
            .attr("fill", "indianred")
            .attr("stroke", "darkred")
    // update
    .merge(patAPoints)                                          
        .transition()
        .duration(1000)
        // .delay(5*1000)
            .attr("cx", xScale("A"))
            .attr("cy", function(d) { return yScale(d.emotion_word); })
            .attr("r", function(d) { return rScale(d.instances); })
            .attr("fill", "indianred")
            .attr("stroke", "darkred")
    // exit
        patAPoints.exit()                
            .transition()
            .duration(1000)
            // .delay(5*1000)
            .attr("r",0)      
            .remove();      


    // Transition to pat A axes

    xAxis.transition()             
        .duration(1000)
        // .delay(5*1000)
        .call(d3.axisBottom().tickPadding(8).scale(xScale));           

    yAxis.transition()              
        .duration(1000)
        // .delay(5*1000)
        .call(d3.axisLeft().tickPadding(8).scale(yScale));   


    /*
    /////////// ///////////  ADD SIMPLE TOOLTIP  /////////// ///////////  
    */

    svg.selectAll("circle")
            .on("mouseover", function(d){      

       var cx = +d3.select(this).attr("cx")+20;   
       var cy = +d3.select(this).attr("cy")+10;

       tooltip.style("visibility", "visible")  
           .style("left", cx + "px")
           .style("top", cy + "px")
           .text(d3.format(".2f")(d.instances)+ " instances");                 


       }).on("mouseout", function(){

       tooltip.style("visibility", "hidden");  

   });  


}

setTimeout(function() { drawPatAPoints(); }, 5000);

/////////// /////////// ///////////  TRANSITION LAST SET OF DATA  ///////////  /////////// /////////// 

// %%%%%%% %%%%%%% %%%%%%%  show:  FULL DATASET  %%%%%%% %%%%%%% %%%%%%% //

// /// DEFINE FULL DATA FUNCTION
function drawFullDataPoints() {

    // Redefine x scale to just include pattern labels from full dataset
    xScale.domain([...new Set(data.map(function(d){return d.pattern_label}))])
        .range([margin.left, width-margin.right])
        .padding(0.5);

    // Redefine y scale
    yScale.domain(reverse_emo_words)
    yScale.range([height-margin.bottom, margin.top]) 

    // Plot points **all datapoints**

    var allPoints = svg.selectAll("circle")                
                .data(data.filter(function(d) { return  d.instances > 0.99}))
            // enter
            allPoints.enter().append("circle")                           
                    .attr("cx", function(d) { return xScale(d.pattern_label); })
                    .attr("cy", function(d) { return yScale(d.emotion_word); })
                    .attr("r", 0)
                    .attr("fill", "mediumpurple")
                    .attr("stroke", "rebeccapurple")
            // update
            .merge(allPoints)                                          
                .transition()
                .duration(1000)
                // .delay(9*1000)
                    .attr("cx", function(d) { return xScale(d.pattern_label); })
                    .attr("cy", function(d) { return yScale(d.emotion_word); })
                    .attr("r", function(d) { return rScale(d.instances); })
                    .attr("fill", "mediumpurple")
                    .attr("stroke", "rebeccapurple");
            // exit
                allPoints.exit()                
                    .transition()
                    .duration(1000)
                    // .delay(9*1000)
                    .attr("r",0)      
                    .remove();      
                
            
            // Transition from pattern A axes to full data axes
            
                xAxis.transition()             
                    .duration(1000)
                    // .delay(9*1000)
                    .call(d3.axisBottom().tickPadding(8).scale(xScale));           
            
                yAxis.transition()              
                    .duration(1000)
                    // .delay(9*1000)
                    .call(d3.axisLeft().tickPadding(8).scale(yScale));   
                    
    /////////// ///////////  ADD SIMPLE TOOLTIP  /////////// ///////////  

    //    svg.selectAll("circle")
    svg.selectAll("circle") 
            .on("mouseover", function(d){       

        var cx = +d3.select(this).attr("cx")+20;   
        var cy = +d3.select(this).attr("cy")+10;

        tooltip.style("visibility", "visible")  
          .style("left", cx + "px")
          .style("top", cy + "px")
          .text(d3.format(".2f")(d.instances)+ " instances");                   

      }).on("mouseout", function(){

         tooltip.style("visibility", "hidden");  

      });                       
    
}


setTimeout(function() { drawFullDataPoints(); }, 9000);


// &&&&&&&&&&&&&&&&&&&&&&&  &&&&&&&&&&&&&&&&&&&&&&&  &&&&&&&&&&&&&&&&&&&&&&&  &&&&&&&&&&&&&&&&&&&&&&&

//##################################### Button presses #####################################// 

  /////////// /////////// ///////////  PLOT FIRST SET OF DATA  ///////////  /////////// ///////////

        // %%%%%%% %%%%%%% %%%%%%%  show:  HAPPY  %%%%%%% %%%%%%% %%%%%%% //

    // ### Happy Button

    d3.select("#happy_data_button").on("click", drawHappyPoints)
    
    
    /////////// /////////// ///////////  TRANSITION TO NEW DATA  ///////////  /////////// /////////// 

        // %%%%%%% %%%%%%% %%%%%%%  show:  PATTERN A  %%%%%%% %%%%%%% %%%%%%% /


    // ### Pattern A Button

    d3.select("#pat_A_button").on("click", drawPatAPoints)
    

    /////////// /////////// ///////////  TRANSITION LAST SET OF DATA  ///////////  /////////// /////////// 

        // %%%%%%% %%%%%%% %%%%%%%  show:  FULL DATASET  %%%%%%% %%%%%%% %%%%%%% //

    
    //### Full dataset button

    d3.select("#data_button").on("click", drawFullDataPoints)

});


// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //


///////// ~ ~ ~ CODE BIB ~ ~ ~ //////////
// 1. Further reading on proper scale choice: https://stackoverflow.com/questions/41941442/d3js-v4-scaleordinal-does-not-have-the-rangepoints/41945740
// 2. Function for column extraction "extractColumn"  https://gist.github.com/eddieajau/5f3e289967de60cf7bf9
// 3. For figuring out the "map" function in x & yScale https://blockbuilder.org/tak7iji/4284a9e665f1d113d6a5c9d378d51e06
// 4. For getting total instance sums https://stackoverflow.com/questions/40206410/d3-on-how-to-sum-values
// 5. For CSS managing overflow in grid layout https://www.smashingmagazine.com/2017/09/css-grid-gotchas-stumbling-blocks/
// 6. For getting just the instances values into their own arrays  https://stackoverflow.com/questions/19590865/from-an-array-of-objects-extract-value-of-a-property-as-array
// 7. Responsive chart: https://brendansudol.com/writing/responsive-d3

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //


//// code graveyard R.I.P. ////


// Make legend

//  var legend = svg2.append("g")
//         .attr("class", "legend")
//         .attr("transform", "translate(" + (width/3 - 150) + "," + (height/3 - 200) + ")")
//         .style("font-size","9px")
//     .selectAll("g")
//         .data([5, 15, 50])
//     .enter().append("g");

// legend.append("circle")
//         .attr("cy", function(d) { return rScale(d); })
//         .attr("r", rScale)
//         .attr("fill", "none")
//         .attr("stroke", "darkgrey");

// legend.append("text")
//         .attr("x", (width/3 - 290))
//         .attr("y", function(d) { return rScale(d); })
//         .attr("dy", "1.0em")
//         .text(d3.format(".1s"));