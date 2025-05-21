# Creating a new SVG
1 - modify x.drawio
2 - export to svg
3 - manually modify the svg, 
-- copy first <svg ...> line from another image
-- remove <g>
-- remove attributes (rely on global attributes in <svg ...>)
-- delete the template rect
-- Manually tweak the start and end lines are at (0,100) and (500,100) - achieve this by using a template rect in x.drawio


# Goals
Smith chart tool re-write goals
1 - Make the code more freiendly to read, so that "the community" can contribute
2 - Hover on the smith chart
3 - use a bundler and lint
4 - Add sliders to components
5 - Add custom circles
6 - Add transformers
7 - move to smithchart.com https://www.smithchart.com
8 - series stub circuit elements
9 - get advertising from that one commentor - count clicks with https://letscountapi.com/docs
10 - put the state in the URL





# To do
-- move mouse handlers into initialize smith chart
-- snap to the data points when hovering on the smith chart
-- clicking adds custom impedance markers
-- with 3 tolerances there should be 6 ends?
-- tolerance box is too close to others, especially on fresh circuit
-- Test all this esr is working! and the sliders!
-- use debouncing to make it work well on slow mobile devices
-- stub show length meters in impedance box
-- slider change impedance box
-- hover to snap to dp's
-- download as svg / png
-- navbar whole width in xxxl mode
-- circles to the top of stack
-- make svg heights 250px instead (or 300)
-- sliders make impedance box change
-- compare transmission lines across new & old project. Whey equations are so different!
-- change er per transmission line
-- Add equations at the bottom of the page
-- create same note about eeff
-- don't error out when shorted stub length 0
-- fix the title bar spacing
-- add a footer

3 - git & host


# to vizualise the file sizes:
npx vite-bundle-visualizer --sourcemap


## License

This project is **not open source**.  
All rights reserved © 2025 28raining.  
You may not copy, modify, redistribute, or use this code or any part thereof for commercial purposes without explicit written permission from the author.