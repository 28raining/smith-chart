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
~~1. Add equations descriptions~~
~~- especially NF site~~
~~2. Add release notes to site~~
~~4. Create unit tests and only allow merge into main branch once unit tests + lint pass~~
~~5. Fix chart hover when using a touch device~~
~~6. See if the microwave guy would like to sponsor the site~~
~~7. Don't error out when shorted stubs length = 0, and other error conditions~~
~~- zo = 0~~
~~- Prevent -ve Q factor, -ve VSWR~~
~~12. remove fixme's~~
9. Review all the old comments, make any previous requests are present (and in unit test?)
- check items more thoroughly vs old site
13. To add Gain, Stability and Noise circles I must add S-parameter inputs
~~-- Use touchstone S-parameter format~~
~~---- chatGPT already wrote me a parser...!~~
~~-- Add a complex-conjugate 'ideal match' to the output of the s-parameter block. This load be in the same SVG. The Smith Chart is then used to design the input circut~~
-- Also get Ropt, NFmin and Rn from s-parameter file
~~-- Users cannot add any more elements after s-parameter file~~
-- Then it's possible to add Noise-Figure, Gain and Stability circles
-- Add plots for Gain and Noise
~~---- S11 and S21 should then be plotted looking into s-parameter block (change Zo from 50 in reflection coefficient equation)~~
-- follow these resources
---- https://www.allaboutcircuits.com/technical-articles/learn-about-designing-unilateral-low-noise-amplifiers/
---- https://www.allaboutcircuits.com/technical-articles/using-the-available-power-gain-to-design-bilateral-low-noise-amplifiers
---- https://www.allaboutcircuits.com/technical-articles/learn-about-unconditional-stability-and-potential-instability-in-rf-amplifier-design/
14. Prevent NF circles where NF < NFmin, R<0
15. Add 'tool' into google search queries - it doesn't show up under smith chart tool
~~16. allow plotting of s-parameters on smith chart on their own?~~
~~17. bbox on small screens the boxs don't align with sliders~~
~~18. move / eliminate DP0 marker~~
~~19. make impedance and reflection ceofficient boxes the same size~~
20. I changed a lot of complex maths, much add testing to ensure site matches old site!
~~21. rename zToPolar~~


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


1 - Add gain circle input
2 - plot gain circles & compare against website
3 - make s-param component icon bigger

Example S1p parameter file:
Infineon example from https://www.youtube.com/watch?v=hh8gTWF7uC8

https://www.johansontechnology.com/products/antennas/rf-antennas/2450at45a0100001e/
https://www.kyocera-avx.com/products/antennas/antenna-resources/ - M830320

# S2P files to-do
1 - Add .s1p and plot S11 just like NanoVNA
-- plot S21 when in IMPEDANCE mode
-- When s1p model added then prevent adding of more blocks
2 - button to add a termination network (for plotting S21 and for terminating the s-parameter model)
3 - Plot Zout when doing 2-parameter model - but don't do an arc to it? Create 2 separate arcs?
4 - Add .s2p and plot S22 & S11
-- by default add 50ohm termination
-- allow move components left and right, so user can easier match
-- option to show or hide S11 & S22
5 - Allow plotting of gain circles when user adds .s2p file

- custom impedance default is blank now?
- Prevent adding anything else after the sparameter
-s-param ico to better reflect s1p too
- can hide or show just one of the plots
- go to s-param plotting mode when add sparam

1. Plot the gain circles with this S2P file
2. Ask user if they want to plot gain circles, or add component to the network? I think this is what's needed...
- test with a different s2p file from a different source
- then use the default touchstone file to test out stability circles
- allow enabling of just one plot (s11 or s22)
-- then user doesn't need to chose between one or other
-- instead move that plotting to results tab? (implement s2p first)
- prevent more components being added
- take example from Youtube person
- check I didn't screq up reflection coefficient maths
-- or span frequency & tol
- create md tutorial in git hub which shows user how to match an antenna like in the youtube
- for S11 plot points, not the line. then can get hover effect. Otherwise hovering over the line sometimes doesn't show frequency

# July 31st to-do list
1d - change bbox to rTerm
1e - in turorial mention complex conjugate matching instead of sparam
1f - make tutorial.md

- plot f-span and s-param curves as dots, not arcs
- Tell user whch sparameter was chosen if their frequency is not exact
- Tell user GsMax? max gain
- can tooltip be changed to not re-render graph
- Tell user the maximum gain
- S11 labes need to have the color of the arc
- Add custom reflection markers
- change black box for termination?
- parallel rlc to series rlc (different merge!)

- Test everything I can! 
-- gain, noise, stability circles
-- s1p and s2p parsing
-- simple circuit z out
-- s11 matching

- put all the nanovna test data thru the touchstone parser
- have some test urls with state to ensure they load up properly
- checkbox to hide z arc, give good label

- gain circles show unit
- either show span for both arcs or neither, and just for s-param frequencies

3.65MHz
20.27uH
66.6pF

2 - (s2p) copy the allaboutcircuits guy, get same results, make tutorial.md
2c - Add 2 arcs for the matching
2d - Plot the gain
2d1 - measure Rs and Rl across frequency
2d2 - calculate gain across frequency


- put all the impedance results into one object
- check if gain changes with characterisitic impedance (obvs it should not)
- span should be sparam of fspan
- now default s2p is added then remove some checking protection (which was half assed anyway)
-- can remove value? so it just goes sparam then data

- Test s-param + tolerance on inductor
- show hover box when over s-params
- throws error when hovering on span dp?
- f markers use f unit to make more readable
- Add noise figure and stability circles later


1 - Get S11 working again
2 - S22 plot Rin and Rout like Steve Arr's site
2 - Fix all the many things above
- create a touchstone generator from the s2p data, populate when modal opens
- restrict frequency selection to somethign in touchstone file

## To do after adding S2P (when the problem is understood better!)
- show sparam and impedance on the same plot, so user can match to certain points - 
- let user move components left and right? at the end shows unused if its after s11? or s-param always goes last? 

## Other ideas (may not do)
- Add frequecny markers when s-param is plotted

#######################
- Sparam DONE
-- I need an example file with example smith chart drawing
-- example in nanosaver
-- plot it here:  https://emisleuth.com/Tools/S-Param-Plotting.html
-- allow user to toggle between s-param plots and smith plots
-- touchstone importer for different frequency units and different formats
- convert S11 from 50ohm to real circuit ohm
- Graph titles
- change fspan when sparam is loaded
- only plot s-param over the frequency range
- fix valid.s1p plot
-- pop up modal when they add sparam block
-- Plot S11 magnitude and phase when in s-param mode
-- allow variable input impedance
0. Create an S2P icon
6 - Plot gain vs frequency

1 - (s1p) copy the youtube guy, get same results, make tutorial.md
-- must change from plotting S11 to plotting relfection looking from the black box
1a - Plot both impedance and s11 on same plot. Doing this because now adding components will come from s-param circle, not from bbox point
1b - allow hide & show s11
1c - if sparameter is added then instead plot impedance from s11 (through the circuit backwards)

2a - let components move left and right
2b - Add rTerm
- fspan not all s11 points, only the restricted points