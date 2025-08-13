# Tuning an Antenna using .s1p file

This tutorial is based on Wolf's antenna tuning video. The .s1p file is linked in that video and also is in this git repo under [../tests/LOOP1S11.s1p](../tests/LOOP1S11.s1p)

https://www.youtube.com/watch?v=hh8gTWF7uC8

### Goal

Tune the antenna to have maximum transmitted power / minimum reflected power at 3.65MHz.
The antenna .s1p file was collected by physically measuring it with a VNA.

### Instructions

1.  Import .s1p file by clicking the S-Parameter component and copying this file contents [../tests/LOOP1S11.s1p](../tests/LOOP1S11.s1p)
    ![S1P Import](images/s1p_import.png)

2.  Set the frequency to 3.65MHz, and to reduce clutter set the frequency range to 0.5MHz

3.  Hover over the chart to read the antenna S11 at 3.65MHz. Our goal it to match this antenna to 50ohms at 3.65MHz
    _(you have to use 3.66MHz because 3.65MHz wasn't measured in .s1p and this tool does not interpolate)_
    ![S1P 3.65MHz](images/s1p_3p65mhz.png)

Note, at this point you could stop with this chart, open a new chart and match your black-box to the complex-conjugate of this impedance. This will give the same matching results as the following steps

Now when components are added to the circuit, the smith chart plots the impedance looking into the antenna; we need to add components bring impedance to 50ohms

4.  Add a matching network. We'll chose the same as the video; 20.27uH series inductor + 66.6pF series capacitor
    ![S1P matched](images/s1p_matched.png)

5.  Plot the reflection coefficient and observe minimal reflection at 3.65MHz - just like Wolfs video
    ![S1P gain](images/s1p_gain.png)

6.  Add some inductor + capacitor ESR (Q-factor) and tolerances then observe large changes in the antenna tuning.
    ![S1P with non-ideal components](images/s1p_tolerance.png)
