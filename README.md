# Online Smith Chart Tool
This website is an interactive Smith Chart, which is a paper chart invented in 1930's used to impedance match, which is needed to maximise power transfer to the load (for example audio speakers, wifi antennas, radar antennas)

Hosted at `onlinesmithchart.com`

# How to run locally
`npm i; npm run dev`

# How the website gets updated
Push to the main branch then the git workflow (`.github/workflows/gh-pages.yml`) will execute
`npm run build`
and push the results into branch `gh-pages`, which is hosted by github-pages

# How to contribute
1. Create a branch
2. Make changes & push to git
3. Review git workflows are passing
4. Create merge request

# Release notes
## v1.0
The tool was previously hosted at `https://www.will-kelsey.com/smith_chart/`. There were quite a few community requests and users were looking at the code base, which was embaressingly poor. This new repo is a total re-write so the code is now to an acceptable standard, it's no longer hosted at a domain under my name, and the community can help maintain this tool thru pull requests.

As well as a re-write, the following new features are added
  - Smith chart is interactive - hover over the chart. This makes it possible to see Z when there are N curves (tol, fspan)
  - Components have sliders - quickly see whether to increase or decrease component values
  - Add Noise Figure circles
  - Add transformer component
  - Save whole state in the URL
  - Move to react + npm. This allows; running lint, more maintainable code, smaller file size, many micro-benefits from joining the mainstream



# Remaining to-do items
1. Add equations descriptions
- especially NF site
2. Add release notes to site
4. Create unit tests and only allow merge into main branch once unit tests + lint pass
- check items more thoroughly vs old site
5. Fix chart hover when using a touch device
6. See if the microwave guy would like to sponsor the site
7. Don't error out when shorted stubs length = 0, and other error conditions
- zo = 0
8. Prevent NF circles where NF < NFmin, R<0
- Prevent -ve Q factor, -ve VSWR
9. Review all the old comments, make any previous requests are present (and in unit test?)
10. Add Gain circles
11. Add stability circles
12. remove fixme's


# Low -priority to-do items
1. Why is the graph re-rendering when mouse-over? Is it expensive?
2. Review performance on 20x slower device than my `m2 mac air`
3. investigate if can use preact, to reduce size and increase spped


# to vizualise the file sizes:
npx vite-bundle-visualizer --sourcemap


## License
This project is **not open source**.  
All rights reserved © 2025 28raining.  
You may not copy, modify, redistribute, or use this code or any part thereof for commercial purposes without explicit written permission from the author.


Testing push protections