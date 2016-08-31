if (!exists('RUTILS')) {

RUTILS = TRUE

# -----------------------------------------------------------------------------

# General set of utilities for munging data / generating plots with R

# -----------------------------------------------------------------------------

rUtils.saferequire <- function(packagename) {
	if (!require(packagename, character.only = TRUE, quietly = TRUE, warn.conflicts = FALSE)) {
		install.packages(packagename) 
		library(packagename, character.only = TRUE, quietly = TRUE, warn.conflicts = FALSE)
	}
}

rUtils.saferequire('dplyr')
rUtils.saferequire('ggplot2')
rUtils.saferequire('ggthemes')
rUtils.saferequire('memoise')

# -----------------------------------------------------------------------------

rUtils.ci <- memoise(function(x, n = 5000){
    structure(
        quantile(
            replicate(n, mean(sample(x, replace = TRUE),
                              na.rm = TRUE)),
            c(0.025, 0.975)),
        names=c("ci.l","ci.u"))
})

rUtils.ci.l <- function(x) {
  rUtils.ci(x)["ci.l"]
}

rUtils.ci.u <- function(x) {
  rUtils.ci(x)["ci.u"]
}

# -----------------------------------------------------------------------------

theme_set(theme_classic(16) + 
      	  theme(axis.line.x = element_line(color="black", size = 0.5),
            	axis.line.y = element_line(color="black", size = 0.5)))

rUtils.plot.tableauify <- function(plot) {
	plot + scale_colour_tableau() + scale_fill_tableau()
}

rUtils.plot.lineSize = 1
rUtils.plot.ribbonAlpha = 0.5

rUtils.plot.linePlotDefaultHeight = 4;
rUtils.plot.linePlotDefaultAspect = 1.5;

}