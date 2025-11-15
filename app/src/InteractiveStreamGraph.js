import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
  componentDidUpdate() {
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);
    // Don't render if data is empty
    if (!chartData || chartData.length === 0) {
      return;
    }

    // Define the LLM model names to visualize
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];
    const colors = { "GPT-4": "#e41a1c", "Gemini": "#377eb8", "PaLM-2": "#4daf4a", "Claude": "#984ea3", "LLaMA-3.1": "#ff7f00" };

    // Write the D3.js code to create the interactive streamgraph visualization here
    const width = 300
    const height = 300


    const svg_parent = d3.select(".svg_parent");
    svg_parent.selectAll("*").remove();

    svg_parent.attr("width", 500)
      .attr("height", 400)
      .attr("transform", `translate(${-500}, ${100})`)

    const svg = svg_parent.append("g")
      .attr("transform", `translate(${10}, ${20})`)


    const data = chartData.map((d, i) => {
      const newDate = {}
      newDate.date = i;
      llmModels.forEach(llm => {
        newDate[llm] = +d[llm]
      });
      return newDate;
    });

    const stackedGraph = d3.stack()
      .keys(llmModels)
      .order(d3.stackOrderInsideOut)
      .offset(d3.stackOffsetWiggle);

    const stackedData = stackedGraph(data);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(data.map((d, i) => i))
      .tickFormat(i => {
        const dateString = (chartData[i].Date).toString().substring(4, 7)
        // console.log(dateString)
        return dateString;
      });

    const yMin = d3.min(stackedData, layer => d3.min(layer, d => d[0]));
    const yMax = d3.max(stackedData, layer => d3.max(layer, d => d[1]));

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height, 0]);

    const areaGenerator = d3.area()
      .x(d => xScale(d.data.date))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveBasis)

    svg.selectAll(".layer")
      .data(stackedData)
      .join("path")
      .attr("class", "layer")
      .attr("d", areaGenerator)
      .attr("fill", d => colors[d.key]);

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "middle");


    const legendBox = svg_parent.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${330}, 20)`);

    const legendKeys = stackedData.map(d => d.key).reverse();

    legendKeys.forEach((key, i) => {
      const legend = legendBox.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legend.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("y", (height / 2) - 12)
        .attr("fill", colors[key]);

      legend.append("text")
        .attr("x", 20)
        .attr("y", height / 2)
        .attr("font-size", "15px")
        .style("text-anchor", "start")
        .text(key);
    });

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "#e8e8e8")
      .style("border", "1px solid black")
      .style("border-radius", "6px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const toolTipWidth = 250;
    const toolTipHeight = 120;

    svg.selectAll(".layer")
      .data(stackedData)
      .join("path")
      .attr("class", "layer")
      .attr("fill", d => colors[d.key])
      .attr("d", areaGenerator)

      .on("mousemove", function (event, layerData) {
        const model = layerData.key;
        tooltip.style("opacity", 1).style("left", event.pageX - 150 + "px").style("top", event.pageY + 20 + "px");
        tooltip.html("");

        tooltip.append("div")
          .style("text-align", "center")
          .style("font-weight", "bold")
          .style("margin-bottom", "4px")
          .text(model);

        const tooltipSVG = tooltip
          .append("svg")
          .attr("width", toolTipWidth + 40)
          .attr("height", toolTipHeight + 45);

        const g = tooltipSVG
          .append("g")
          .attr("transform", `translate(${30},${20})`);


        const modelValues = data.map(d => d[model]);
        const boxXAxis = d3
          .scaleBand()
          .domain(modelValues.map((_, i) => i))
          .range([0, toolTipWidth])
          .padding(0.1);

        const boxYAxis = d3
          .scaleLinear()
          .domain([0, d3.max(modelValues)])
          .range([toolTipHeight, 0]);

        g.selectAll("rect")
          .data(modelValues)
          .join("rect")
          .attr("x", (_, i) => boxXAxis(i))
          .attr("y", d => boxYAxis(d))
          .attr("width", boxXAxis.bandwidth())
          .attr("height", d => toolTipHeight - boxYAxis(d))
          .attr("fill", colors[model]);

        g.append("g")
          .attr("transform", `translate(0,${toolTipHeight})`)
          .call(d3.axisBottom(boxXAxis).tickValues(data.map((d, i) => i))
            .tickFormat(i => {
              const dateString = (chartData[i].Date).toString().substring(4, 7)
              return dateString;
            }));


        g.append("g").call(d3.axisLeft(boxYAxis).ticks(4));
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", 0);
      });

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "middle");
  }

  render() {
    return (
      <svg style={{ width: 500, height: 400 }} className="svg_parent">
      </svg>
    );
  }
}

export default InteractiveStreamGraph;