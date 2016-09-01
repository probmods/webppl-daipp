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
rUtils.saferequire('lazyeval')

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

rUtils.plot.linePlot <- function(datafilename, outfilename, groupbys, x, y, xlabel, ylabel,
                                 colorby = NULL, ribbon = TRUE,
                                 height = rUtils.plot.linePlotHeight,
                                 aspect = rUtils.plot.linePlotAspect) {
  data = read.csv(datafilename)

  # Arcane bullshittery: turn the groupbys character vector into a symbol vector
  data.agg = data %>% group_by_(.dots = lapply(groupbys, as.symbol)) %>%
  # More arcane bullshittery: using lazyeval's interp to partially-evaluate a variable value into a quote
    summarise_(
      x.median = interp(~median(x), x = as.symbol(x)),
      y.mean = interp(~mean(y), y = as.symbol(y)),
      y.ci.l = interp(~rUtils.ci.l(y), y = as.symbol(y)),
      y.ci.u = interp(~rUtils.ci.u(y), y = as.symbol(y))
    )

  line_aes = if (!is.null(colorby))
    aes(y = y.mean, color = get('colorby')) else
    aes(y = y.mean)

  plot = rUtils.plot.tableauify(
       ggplot(data = data.agg,
              mapping = aes(x = x.median)) +
         geom_line(mapping = line_aes,
                   size = rUtils.plot.lineSize) +
         xlab(xlabel) +
         ylab(ylabel))

  if (ribbon) {
    ribbon_aes = if (!is.null(colorby))
      aes(ymin = y.ci.l, ymax = y.ci.u, fill = get('colorby')) else
      aes(ymin = y.ci.l, ymax = y.ci.u)

    plot = plot + geom_ribbon(mapping = ribbon_aes,
                              alpha = rUtils.plot.ribbonAlpha)
  }

  ggsave(outfilename, plot,
       width = rUtils.plot.linePlotHeight * rUtils.plot.linePlotAspect,
       height = rUtils.plot.linePlotHeight)
}

# -----------------------------------------------------------------------------

rUtils.plot.elboProgress <- function(datafilename, outfilename,
                                     condition = NULL, ribbon = TRUE,
                                     height, aspect) {
  groupbys = if (!is.null(condition))
    c(condition, 'index') else
    c('index')

  rUtils.plot.linePlot(datafilename, outfilename,
    groupbys = groupbys, x = 'iter', y = 'objective',
    xlabel = 'Iteration', ylabel = 'ELBO',
    colorby = condition, ribbon = ribbon,
    height = height, aspect = aspect)
}

# -----------------------------------------------------------------------------

)
