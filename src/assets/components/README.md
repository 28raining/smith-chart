# Creating a new SVG
 - modify x.drawio
 - export to svg
 - manually modify the svg, 
   - copy first <svg ...> line from another image
   - remove <g>
   - remove attributes (rely on global attributes in <svg ...>)
   - delete the template rect (used to set w&h in drawio)
   - Manually tweak the start and end lines are at (0,100) and (500,100)