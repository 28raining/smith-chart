# Analyzing Stability

This tutorial is based on Dr. Steve Arar's stability article
https://www.allaboutcircuits.com/technical-articles/learn-about-unconditional-stability-and-potential-instability-in-rf-amplifier-design/

Stability circles indicate where the s-parameter device would go unstable, which can happen with active devices when the magnitude of reflection coefficient > 1. Oscillation is possible when either the input or output port produces a negative resistance.

### Goal
Plot the stability circles

[See the end result here (manually check stability circles)](https://onlinesmithchart.com/?circuit=blackBox_50_0_0__sparam_s2p_MHz_50_100_0.72_-46_17.973_148.5_0.03_68.5_0.88_-23.6_200_0.612_-80.9_13.927_127.3_0.047_57.1_0.697_-37.6_400_0.497_-121.3_8.656_105_0.066_51.3_0.479_-47.6_600_0.456_-143.5_6.08_92.8_0.079_52.9_0.382_-50.5_800_0.44_-157.6_4.725_84.3_0.094_55.4_0.339_-51.8_1000_0.436_-167.5_3.864_77_0.11_56.8_0.323_-53.4_1200_0.434_-176.1_3.258_70.3_0.126_57.9_0.312_-55.8_1400_0.433_176.6_2.847_64.5_0.143_58.4_0.304_-58.3_1600_0.433_170.9_2.329_57.4_0.16_58.9_0.296_-62_1800_0.434_165_2.252_54.2_0.178_58.6_0.293_-65_2000_0.439_159.6_2.057_49.2_0.197_58.1_0.294_-68.1__loadTerm_50_0_0&frequency=100&fSpan=2000)

### Instructions

1.  Import .s2p file by clicking the S-Parameter component and copying these s-parameters
```
# MHz S MA R 50
100    0.720  -46.0    17.973  148.5    0.030   68.5    0.880  -23.6
200    0.612  -80.9    13.927  127.3    0.047   57.1    0.697  -37.6
400    0.497 -121.3     8.656  105.0    0.066   51.3    0.479  -47.6
600    0.456 -143.5     6.080   92.8    0.079   52.9    0.382  -50.5
800    0.440 -157.6     4.725   84.3    0.094   55.4    0.339  -51.8
1000   0.436 -167.5     3.864   77.0    0.110   56.8    0.323  -53.4
1200   0.434 -176.1     3.258   70.3    0.126   57.9    0.312  -55.8
1400   0.433  176.6     2.847   64.5    0.143   58.4    0.304  -58.3
1600   0.433  170.9     2.329   57.4    0.160   58.9    0.296  -62.0
1800   0.434  165.0     2.252   54.2    0.178   58.6    0.293  -65.0
2000   0.439  159.6     2.057   49.2    0.197   58.1    0.294  -68.1
```

2. Set frequency to 100MHz like in the article
    ![Stability Circles](images/stability.png)

Is stability inside or outside the circle?
Because `|S22| < 1` the __input__ is stable at the center of the chart (zo + 0j). Therefore, the circles must contain the unstable region. This is marked by labels on the chart