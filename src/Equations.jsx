import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const asciiArtTransformer = `
 --- (L1-Lm) --- --- (L2-Lm) ---  <- look this way
|                    |
Zl                Lm
|                    |
`;

function Equations() {
  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<ArrowDownwardIcon />} aria-controls="panel1-content" id="panel1-header">
          <Typography component="span">Equations used by this site</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Table
            size="small"
            sx={{
              "& .MuiTableCell-root": {
                border: "1px solid #ccc",
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>Item</TableCell>
                <TableCell>Equation</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Typography>Transformer</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "pre" }}>{asciiArtTransformer}</TableCell>
                <TableCell>
                  <Typography>Simple 3-inductor equivalent model</Typography>
                  <math xmlns="http://www.w3.org/1998/Math/MathML">
                    <mrow>
                      <msub>
                        <mi>l</mi>
                        <mrow>
                          <mi>m</mi>
                        </mrow>
                      </msub>
                      <mo>=</mo>
                      <mi>k</mi>
                      <msqrt>
                        <mrow>
                          <mi>l</mi>
                          <mn>1</mn>
                          <mo>&#x2062;</mo>
                          <mi>l</mi>
                          <mn>2</mn>
                        </mrow>
                      </msqrt>
                    </mrow>
                  </math>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography>Transmission Lines</Typography>
                </TableCell>
                <TableCell>
                  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                    <mrow>
                      <msub>
                        <mi>Z</mi>
                      </msub>
                      <mo>=</mo>
                      <msub>
                        <mi>Z</mi>
                        <mn>0</mn>
                      </msub>
                      <mfrac>
                        <mrow>
                          <msub>
                            <mi>Z</mi>
                            <mi>L</mi>
                          </msub>
                          <mo>+</mo>
                          <mi>j</mi>
                          <msub>
                            <mi>Z</mi>
                            <mn>0</mn>
                          </msub>
                          <mo>tan</mo>
                          <mo>(</mo>
                          <mi>&#x03B2;</mi>
                          <mi>&#x2113;</mi>
                          <mo>)</mo>
                        </mrow>
                        <mrow>
                          <msub>
                            <mi>Z</mi>
                            <mn>0</mn>
                          </msub>
                          <mo>+</mo>
                          <mi>j</mi>
                          <msub>
                            <mi>Z</mi>
                            <mi>L</mi>
                          </msub>
                          <mo>tan</mo>
                          <mo>(</mo>
                          <mi>&#x03B2;</mi>
                          <mi>&#x2113;</mi>
                          <mo>)</mo>
                        </mrow>
                      </mfrac>
                    </mrow>
                  </math>
                </TableCell>
                <TableCell>
                  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                    <mrow>
                      <mi>&#x03B2;</mi>
                      <mo>=</mo>{" "}
                      <mfrac>
                        <mrow>
                          <mn>2</mn>
                          <mi>&#x03C0;</mi>
                        </mrow>
                        <mi>&#x03BB;</mi>
                      </mfrac>
                    </mrow>
                  </math>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography>Stub</Typography>
                </TableCell>
                <TableCell>
                  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                    <msub>
                      <mi>Z</mi>
                    </msub>
                    <mo>=</mo>
                    <mfrac>
                      <mrow>
                        <mo>-</mo>

                        <mi>j</mi>
                        <msub>
                          <mi>Z</mi>
                          <mn>0</mn>
                        </msub>
                      </mrow>
                      <mrow>
                        <mi>tan</mi>
                        <mo>(</mo>
                        <mi>&#x3B2;</mi>
                        <mo>&#x2062;</mo>
                        <mi>&#x2113;</mi>

                        <mo>)</mo>
                      </mrow>
                    </mfrac>
                  </math>
                </TableCell>
                <TableCell>
                  <Typography>This is added in parallel</Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography>Shorted Stub</Typography>
                </TableCell>
                <TableCell>
                  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                    <msub>
                      <mi>Z</mi>
                    </msub>
                    <mo>=</mo>
                    <mfrac>
                      <mrow>
                        <mo>-</mo>

                        <mi>j</mi>
                        <msub>
                          <mi>Z</mi>
                          <mn>0</mn>
                        </msub>
                      </mrow>
                      <mrow>
                        <mi>tan</mi>
                        <mo>(</mo>
                        <mi>&#x3B2;</mi>
                        <mi>&#x2113;</mi>
                        <mo>+</mo>
                        <mfrac>
                          <mrow>
                            <mi>&#x03C0;</mi>
                          </mrow>
                          <mi>2</mi>
                        </mfrac>
                        <mo>)</mo>
                      </mrow>
                    </mfrac>
                  </math>
                </TableCell>
                <TableCell>
                  <Typography>Note that</Typography>
                  <math xmlns="http://www.w3.org/1998/Math/MathML">
                    <mrow>
                      <mo>cot</mo>
                      <mo>(</mo>
                      <mi>x</mi>
                      <mo>+</mo>
                      <mfrac>
                        <mn>π</mn>
                        <mn>2</mn>
                      </mfrac>
                      <mo>)</mo>
                      <mo>=</mo>
                      <mo>-tan</mo>
                      <mo>(</mo>
                      <mi>x</mi>
                      <mo>)</mo>
                    </mrow>
                  </math>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography>Noise Figure Circles</Typography>
                </TableCell>
                <TableCell>
                  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                    <mi>N</mi>
                    <mtext>&#xA0;</mtext>
                    <mo>=</mo>
                    <mtext>&#xA0;</mtext>
                    <mfrac>
                      <mrow>
                        <mi>F</mi>
                        <mtext>&#xA0;</mtext>
                        <mo>&#x2212;</mo>
                        <mtext>&#xA0;</mtext>
                        <msub>
                          <mi>F</mi>
                          <mrow>
                            <mi>m</mi>
                            <mi>i</mi>
                            <mi>n</mi>
                          </mrow>
                        </msub>
                      </mrow>
                      <mrow>
                        <mn>4</mn>
                        <msub>
                          <mi>R</mi>
                          <mi>N</mi>
                        </msub>
                        <mrow>
                          <mo>/</mo>
                        </mrow>
                        <msub>
                          <mi>Z</mi>
                          <mn>0</mn>
                        </msub>
                      </mrow>
                    </mfrac>
                    <mrow>
                      <mo stretchy="false">|</mo>
                    </mrow>
                    <mn>1</mn>
                    <mtext>&#xA0;</mtext>
                    <mo>+</mo>
                    <mtext>&#xA0;</mtext>
                    <msub>
                      <mi mathvariant="normal">&#x0393;</mi>
                      <mrow>
                        <mi>o</mi>
                        <mi>p</mi>
                        <mi>t</mi>
                      </mrow>
                    </msub>
                    <msup>
                      <mrow>
                        <mo stretchy="false">|</mo>
                      </mrow>
                      <mn>2</mn>
                    </msup>
                  </math>
                  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                    <msub>
                      <mi>Circle</mi>
                      <mi>center</mi>
                    </msub>
                    <mtext>&#xA0;</mtext>
                    <mo>=</mo>
                    <mtext>&#xA0;</mtext>
                    <mfrac>
                      <msub>
                        <mi mathvariant="normal">&#x0393;</mi>
                        <mrow>
                          <mi>o</mi>
                          <mi>p</mi>
                          <mi>t</mi>
                        </mrow>
                      </msub>
                      <mrow>
                        <mi>N</mi>
                        <mtext>&#xA0;</mtext>
                        <mo>+</mo>
                        <mtext>&#xA0;</mtext>
                        <mn>1</mn>
                      </mrow>
                    </mfrac>
                  </math>
                  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                    <msub>
                      <mi>Circle</mi>
                      <mi>radius</mi>
                    </msub>
                    <mtext>&#xA0;</mtext>
                    <mo>=</mo>
                    <mtext>&#xA0;</mtext>
                    <mfrac>
                      <mrow>
                        <msqrt>
                          <mi>N</mi>
                          <mo stretchy="false">(</mo>
                          <mi>N</mi>
                          <mtext>&#xA0;</mtext>
                          <mo>+</mo>
                          <mtext>&#xA0;</mtext>
                          <mn>1</mn>
                          <mtext>&#xA0;</mtext>
                          <mo>&#x2212;</mo>
                          <mtext>&#xA0;</mtext>
                          <mrow>
                            <mo stretchy="false">|</mo>
                          </mrow>
                          <msub>
                            <mi mathvariant="normal">&#x0393;</mi>
                            <mrow>
                              <mi>opt</mi>
                            </mrow>
                          </msub>
                          <msup>
                            <mrow>
                              <mo stretchy="false">|</mo>
                            </mrow>
                            <mn>2</mn>
                          </msup>
                        </msqrt>
                        <mo stretchy="false">)</mo>
                      </mrow>
                      <mrow>
                        <mi>N</mi>
                        <mtext>&#xA0;</mtext>
                        <mo>+</mo>
                        <mtext>&#xA0;</mtext>
                        <mn>1</mn>
                      </mrow>
                    </mfrac>
                  </math>
                </TableCell>
                <TableCell>
                  <Typography>
                    Cross checked{" "}
                    <a href="https://www.allaboutcircuits.com/technical-articles/learn-about-designing-unilateral-low-noise-amplifiers/">here</a> and{" "}
                    <a href="https://homepages.uc.edu/~ferendam/Courses/EE_611/Amplifier/NFC.html">here</a>
                  </Typography>
                  <math xmlns="http://www.w3.org/1998/Math/MathML">
                    <msub>
                      <mi mathvariant="normal">&#x0393;</mi>
                      <mrow>
                        <mi>opt</mi>
                      </mrow>
                    </msub>
                  </math>{" "}
                  is the reflection coeffient of your circuit
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

export default Equations;
