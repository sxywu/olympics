export default `
<center>
# dive fractals:
## synchronized diving in the olympics
# 🏅
</center>
<br />

Ever since I was a kid, I've loved watching the summer Olympics, and out of all the events, I especially loved gymnastics and diving.  And though it was mostly because I come from a Chinese household and it was all we watched, I also loved the two for their grace and beauty.  In this visualization, I was inspired by [Dan Gries'](https://twitter.com/RectangleWorld)s [Sweeping Fractal Lines](http://rectangleworld.com/blog/archives/462), and wanted to recreate the beauty and fluidity of the divers in the flowing lines.

Each line represents a **synchronized diving team**, and its **height** represents its total score. There are a total of six rounds of diving for the mens' event, and five for the women, which explains the disparity in height between the two events.  Diving is scored based on a **difficulty score** (ranging from 2.0 to 3.9, in these cases), and six **execution scores** (out of 10).  I've used the difficulty and execution scores to determine the radius of the lines at each round, and a wider section indicates a difficult dive executed well.  Conversely, a narrower section may have a low difficulty rating, or even a high difficulty with low execution.

Each round is denoted by its difficulty as well as the score for that round.  Hover to see all the execution scores for that round, and click to see all dives from that round.
`.trim();
