# Online Smith Chart Tool
This website is an interactive Smith Chart (a paper chart invented in 1930's used to impedance match) which is needed to maximise power transfer from the source to the load - for example with audio speakers or wifi antennas

Hosted at `onlinesmithchart.com`

# How to run locally
```
npm i
npm run dev
```

# How the website gets updated
Any push to the main branch will automatically launch the git workflow (`.github/workflows/gh-pages.yml`), which does this:
```
npm run build
```
and pushes the results into `gh-pages` - the branch hosted by github-pages

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
9. Review all the old comments, make any previous requests are present (and in unit test?)
15. Add 'tool' into google search queries - it doesn't show up under smith chart tool


# Low -priority to-do items
1. Why is the graph re-rendering when mouse-over? Is it expensive?
2d1 - measure Rs and Rl across frequency
2 - S22 plot Rin and Rout like Steve Arr's sit
- let user plot gain without adding .s2p?

# to vizualise the file sizes:
npx vite-bundle-visualizer --sourcemap


## License
This work is licensed under a Creative Commons Attribution 4.0 International License. You may not resell this tool

# For next git merge after s-param fixes
- comment on youtuber wolfs page

## #####################
## ## Sparam DONE ## ##
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
- Prevent adding anything else after the sparameter
-s-param ico to better reflect s1p too
- can hide or show just one of the plots
- go to s-param plotting mode when add sparam
- put all the nanovna test data thru the touchstone parser
- plot f-span and s-param curves as dots, not arcs
- Tell user whch sparameter was chosen if their frequency is not exact
- Tell user GsMax? max gain
- Tell user the maximum gain
- S11 labes need to have the color of the arc
- add f-unit to hover
- checkbox to hide z arc, give good label
- gain circles show unit
- either show span for both arcs or neither, and just for s-param frequencies
2c - Add 2 arcs for the matching
2d - Plot the gain
2d2 - calculate gain across frequency
- check if gain changes with characterisitic impedance (obvs it should not)
-- make gain plot pretty (currently it's mislabled)
- span should be sparam of fspan
- now default s2p is added then remove some checking protection (which was half assed anyway)
- test with a different s2p file from a different source
- then use the default touchstone file to test out stability circles
- allow enabling of just one plot (s11 or s22)
-- then user doesn't need to chose between one or other
-- instead move that plotting to results tab? (implement s2p first)
- prevent more components being added
- take example from Youtube person
- can remove value? so it just goes sparam then data
- show hover box when over s-params
- throws error when hovering on span dp?
- f markers use f unit to make more readable
- Test s-param + tolerance on inductor
-- S22 is done, s11 needs doing
- test sparam + tolerance
- make sure tol still works
- only 1 sparam allowed!
- restrict frequency selection to somethign in touchstone file
- hide / show impedance arcs
- fix colors when 2 matching networks with s2p
- show sparam and impedance on the same plot, so user can match to certain points - 
- let user move components left and right? at the end shows unused if its after s11? or s-param always goes last? 
- Add frequecny markers when s-param is plotted
- give alert if dummy sparameter data was loaded
- remove spurious logging
- run lint and prettier
- for S11 plot points, not the line. then can get hover effect. Otherwise hovering over the line sometimes doesn't show frequency
- check performance on slower device
-- Must show G0 for s2p gain matching to be possible
1e - in turorial mention complex conjugate matching instead of sparam
1f - make tutorial.md
2 - (s2p) copy the allaboutcircuits guy, get same results, make tutorial.md
- re-add URL saving
- create md tutorial in git hub which shows user how to match an antenna like in the youtube
- graph title custom termination
-- fix comment about imedance looking into black box when s1p file
- Move impedance calcutions into one function, to allow testing
- Test everything I can! 
-- gain, noise, stability circles
-- s1p and s2p parsing
-- simple circuit z out
-- s2p matching
-- s11 matching
- have some test urls with state to ensure they load up properly
- add used equations
- add link to tutorials
- release notes
- compare a few legacy test cases vs site
- check I didn't screq up reflection coefficient maths
-- or span frequency & tol
- plot input gain, output gain and middle gain thing - instead, showing GS0 in the plot
- add nfmin to input box
- plot noise figure with gain
- noise tutorial
- disbaled grayed out
## ## Stability circles DONE ## ##
- check stability inisde circle reading is correct
- can color outside of a circle?
- Tutorial
- Testing
- Stability used equations
- custom markers can be polar
- parallel rlc to series rlc (different merge!)
- when tol + fspan, make the gray markers gray
- Add noise figure and stability circles later
- Series RLC should be named parallel RLC
-- test ESL as it's broken rn
- show s21 plots even before span is added
- Store s-parameter if it's under 10 lines long
- add button to autofill s-param with this default
- link to TRGMC
- add links to end produce from tutorials (can ensure they work in future!)
14. Prevent NF circles where NF < NFmin, R<0
20. I changed a lot of complex maths, much add testing to ensure site matches old site!
21. better compress the custom-component URL - not going to do
1. Add equations descriptions
- especially NF site
2. Add release notes to site
4. Create unit tests and only allow merge into main branch once unit tests + lint pass
5. Fix chart hover when using a touch device
6. See if the microwave guy would like to sponsor the site
7. Don't error out when shorted stubs length = 0, and other error conditions
- zo = 0
- Prevent -ve Q factor, -ve VSWR
12. remove fixme's
-- Use touchstone S-parameter format
---- chatGPT already wrote me a parser...!
-- Add a complex-conjugate 'ideal match' to the output of the s-parameter block. This load be in the same SVG. The Smith Chart is then used to design the input circut
-- Users cannot add any more elements after s-parameter file
---- S11 and S21 should then be plotted looking into s-parameter block (change Zo from 50 in reflection coefficient equation)
16. allow plotting of s-parameters on smith chart on their own?
17. bbox on small screens the boxs don't align with sliders
18. move / eliminate DP0 marker
19. make impedance and reflection ceofficient boxes the same size
21. rename zToPolar
2. Review performance on 20x slower device than my `m2 mac air`
4. can we do gain for s1p?
3. investigate if can use preact, to reduce size and increase spped
