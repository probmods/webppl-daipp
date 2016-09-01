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

rUtils.dirOfThisFile <- function() {
  cmdArgs <- commandArgs(trailingOnly = FALSE)
  needle <- "--file="
  match <- grep(needle, cmdArgs)
  if (length(match) > 0) {
    # Rscript
    return(dirname(normalizePath(sub(needle, "", cmdArgs[match]))))
  } else {
    # 'source'd via R console
    return(dirname(normalizePath(sys.frames()[[1]]$ofile)))
  }
}

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

rUtils.plot.linePlotHeight = 4;
rUtils.plot.linePlotAspect = 1.5;

}

rUtils.plot.elboProgress <- function(datafilename, outfilename,
                                     condition = NULL, ribbon = TRUE,
                                     height = rUtils.plot.linePlotHeight,
                                     aspect = rUtils.plot.linePlotAspect) {
  data = read.csv(datafilename)

  data.agg = if (!is.null(condition)) data %>% group_by(condition) else data
  data.agg = data.agg %>% 
    group_by(index) %>%
    summarise(iter = median(iter),
          objective.mean = mean(objective),
          objective.ci.l = rUtils.ci.l(objective),
          objective.ci.u = rUtils.ci.u(objective))

  line_aes = if (!is.null(condition))
    aes(y = objective.mean, color = get('condition')) else
    aes(y = objective.mean)

  plot = rUtils.plot.tableauify(
       ggplot(data = data.agg,
          mapping = aes(x = iter)) +
         geom_line(mapping = line_aes,
                   size = rUtils.plot.lineSize) +
         xlab("Iteration") +
         ylab("ELBO"))

  if (ribbon) {
    ribbon_aes = if (!is.null(condition))
      aes(ymin = objective.ci.l, fill = get('condition'), ymax = objective.ci.u) else
      aes(ymin = objective.ci.l, ymax = objective.ci.u)

    plot = plot + geom_ribbon(mapping = ribbon_aes,
                              alpha = rUtils.plot.ribbonAlpha)
  }
  
  ggsave(outfilename, plot,
       width = rUtils.plot.linePlotHeight * rUtils.plot.linePlotAspect,
       height = rUtils.plot.linePlotHeight)
}

