d3.csv("pokemon_alopez247.csv").then(data => {
    // Convert numeric fields
    data.forEach(d => {
    d.Weight_kg = +d.Weight_kg;
    d.Height_m = +d.Height_m;
    d.HP = +d.HP;
    d.Attack = +d.Attack;
    d.Defense = +d.Defense;
    d.Sp_Atk = +d.Sp_Atk;
    d.Sp_Def = +d.Sp_Def;
    d.Speed = +d.Speed;
});

// Group by Type_1 and compute average Weight and Height
const typeStats = d3.rollups(
data,
v => ({
    avgWeight: d3.mean(v, d => d.Weight_kg),
    avgHeight: d3.mean(v, d => d.Height_m),
    avgHP: d3.mean(v, d => d.HP),
    avgAttack: d3.mean(v, d => d.Attack),
    avgDefense: d3.mean(v, d => d.Defense),
    avgSp_Atk: d3.mean(v, d => d.Sp_Atk),
    avgSp_Def: d3.mean(v, d => d.Sp_Def),
    avgSpeed: d3.mean(v, d => d.Speed)
}),
d => d.Type_1
).map(([type, stats]) => ({ type, ...stats }));

// Sort by avgWeight descending for nicer display
typeStats.sort((a, b) => b.avgWeight - a.avgWeight);

// Setup combo chart dimensions and SVG
const comboSvg = d3.select("#combo-chart");
const margin = { top: 40, right: 50, bottom: 100, left: 70 };
const width = comboSvg.node().clientWidth - margin.left - margin.right;
const height = comboSvg.node().clientHeight - margin.top - margin.bottom;

comboSvg.selectAll("*").remove();

const g = comboSvg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Add a title text element for selected type (initially empty)
const selectedTypeText = comboSvg.append("text")
    .attr("class", "selected-type-label")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("");  // initially empty


// Scales
const x = d3.scaleBand()
    .domain(typeStats.map(d => d.type))
    .range([0, width])
    .padding(0.2);

const yLeft = d3.scaleLinear()
    .domain([0, d3.max(typeStats, d => d.avgWeight)*1.1])
    .range([height, 0]);

const yRight = d3.scaleLinear()
    .domain([0, d3.max(typeStats, d => d.avgHeight)*1.1])
    .range([height, 0]);

// Color scale for types (categorical)
const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(typeStats.map(d => d.type));

// Bars for avgWeight
g.selectAll(".bar")
    .data(typeStats)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.type))
    .attr("y", d => yLeft(d.avgWeight))
    .attr("width", x.bandwidth())
    .attr("height", d => height - yLeft(d.avgWeight))
    .attr("fill", d => color(d.type))
    .style("cursor", "pointer")
.on("click", (event, d) => {
    // update star chart and parallel coords
    updateStarChart(d.type);
    updateParallelCoords(d.type);

    // highlight selected bar
    g.selectAll(".bar")
        .attr("fill", barData => barData.type === d.type ? "limegreen" : color(barData.type));

    // update the selected type label text
    selectedTypeText.text(`Selected type: ${d.type}`);
});



// Line for avgHeight
const line = d3.line()
    .x(d => x(d.type) + x.bandwidth()/2)
    .y(d => yRight(d.avgHeight));

g.append("path")
    .datum(typeStats)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("d", line);

// Circles for height points
g.selectAll(".height-point")
    .data(typeStats)
    .enter()
    .append("circle")
    .attr("class", "height-point")
    .attr("cx", d => x(d.type) + x.bandwidth()/2)
    .attr("cy", d => yRight(d.avgHeight))
    .attr("r", 4)
    .attr("fill", "black");

// Axes
g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end")
    .attr("dx", "-0.6em")
    .attr("dy", "0.15em");

// X Axis Label
g.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .style("font-weight", "bold")
    .style("font-size", "14px")
    .attr("fill", "black")
    .text("Pokémon Type");

g.append("g")
    .call(d3.axisLeft(yLeft))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("font-size", "14px")
    .attr("fill", "black")
    .text("Pokémon Weight (kg)");

g.append("g")
    .attr("transform", `translate(${width},0)`)
    .call(d3.axisRight(yRight))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 40)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("font-size", "14px")
    .attr("fill", "black")
    .text("Pokémon Height (m)");

// Add a title showing the selected Type
comboSvg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")

// --- Star Chart stub ---

function updateStarChart(type) {
// Filter Pokémon of this type
const filtered = data.filter(d => d.Type_1 === type);

// Compute averages of traits for this type
const avgStats = {
    HP: d3.mean(filtered, d => d.HP),
    Attack: d3.mean(filtered, d => d.Attack),
    Defense: d3.mean(filtered, d => d.Defense),
    Sp_Atk: d3.mean(filtered, d => d.Sp_Atk),
    Sp_Def: d3.mean(filtered, d => d.Sp_Def),
    Speed: d3.mean(filtered, d => d.Speed)
};

// Clear star chart SVG
const starSvg = d3.select("#star-chart svg");
starSvg.selectAll("*").remove();

const starWidth = starSvg.node().clientWidth;
const starHeight = starSvg.node().clientHeight;
const margin = 40;
const radius = Math.min(starWidth, starHeight) / 2 - margin;

const gStar = starSvg.append("g")
    .attr("transform", `translate(${starWidth / 2},${starHeight / 2})`);

// Traits and scales
const traits = Object.keys(avgStats);
const maxStat = 150; // max for scale (adjust as needed)
const angleSlice = (2 * Math.PI) / traits.length;

const rScale = d3.scaleLinear()
    .domain([0, maxStat])
    .range([0, radius]);

// Draw circular grid lines
const levels = 5;
for(let level = 1; level <= levels; level++) {
const r = radius / levels * level;
gStar.append("circle")
    .attr("r", r)
    .attr("fill", "none")
    .attr("stroke", "#ccc");
}

traits.forEach((trait, i) => {
const angle = i * angleSlice - Math.PI / 2;
const x = rScale(maxStat) * Math.cos(angle);
const y = rScale(maxStat) * Math.sin(angle);

// Axis line
gStar.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", x)
    .attr("y2", y)
    .attr("stroke", "grey")
    .attr("stroke-width", 1);

// Calculate min and max for this trait among filtered Pokémon
const minVal = d3.min(filtered, d => d[trait]);
const maxVal = d3.max(filtered, d => d[trait]);

// Label trait name at axis end
gStar.append("text")
    .attr("x", x * 1.1)
    .attr("y", y * 1.1)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "11px")
    .style("font-weight", "bold")
    .text(trait);

// Label min value slightly inside near origin
gStar.append("text")
    .attr("x", x * 0.15)
    .attr("y", y * 0.15)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "9px")
    .style("fill", "gray")
    .text(minVal.toFixed(0));

// Label max value at axis end
gStar.append("text")
    .attr("x", x * 1.3)
    .attr("y", y * 1.3)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "9px")
    .style("fill", "gray")
    .text(maxVal.toFixed(0));
});

// Build data points for polygon
const linePoints = traits.map((trait, i) => {
const angle = i * angleSlice - Math.PI / 2;
return [
    rScale(avgStats[trait]) * Math.cos(angle),
    rScale(avgStats[trait]) * Math.sin(angle)
];
});

// Draw filled polygon
gStar.append("polygon")
    .attr("points", linePoints.map(d => d.join(",")).join(" "))
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.5);
}

function updateParallelCoords(selectedType) {
const pcSvg = d3.select("#sankey-chart svg"); // reuse the sankey SVG container
pcSvg.selectAll("*").remove();

const width = pcSvg.node().clientWidth;
const height = pcSvg.node().clientHeight;
const margin = { top: 40, right: 30, bottom: 20, left: 40 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = pcSvg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Filter data for the selected Type_1
const filtered = data.filter(d => d.Type_1 === selectedType);

// Define the dimensions (traits) to plot in parallel coordinates
const dimensions = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];

// Create a scale for each dimension
const y = {};
for (const dim of dimensions) {
y[dim] = d3.scaleLinear()
    .domain(d3.extent(filtered, d => d[dim]))
    .range([innerHeight, 0]);
}

// x scale for dimension placement
const x = d3.scalePoint()
    .domain(dimensions)
    .range([0, innerWidth])
    .padding(0.5);

// Draw vertical axes for each dimension
g.selectAll(".dimension")
    .data(dimensions)
    .enter()
    .append("g")
    .attr("class", "dimension")
    .attr("transform", d => `translate(${x(d)},0)`)
    .each(function(d) {
d3.select(this).call(d3.axisLeft(y[d]));
})
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", -15)
    .text(d => d)
    .style("font-weight", "bold")
    .style("fill", "black");

// Line generator for parallel coordinates
function path(d) {
return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
}

// Draw lines for each Pokémon in filtered data
g.append("g")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-opacity", 0.3)
    .selectAll("path")
    .data(filtered)
    .enter()
    .append("path")
    .attr("d", path);
}


// Initialize star chart with first type by default
if (typeStats.length) {
updateStarChart(typeStats[0].type);
updateParallelCoords(typeStats[0].type);
}
});
