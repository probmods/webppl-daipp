if (!exists('plotUtils')) {

plotUtils = TRUE

# -----------------------------------------------------------------------------

# General set of utilities for munging data / generating plots with R

# -----------------------------------------------------------------------------

saferequire <- function(packagename) {
	if (!require(packagename, character.only = TRUE, quietly = TRUE, warn.conflicts = FALSE)) {
		install.packages(packagename) 
		library(packagename, character.only = TRUE, quietly = TRUE, warn.conflicts = FALSE)
	}
}

saferequire('dplyr')
saferequire('ggplot2')
saferequire('ggthemes')
saferequire('memoise')
saferequire('lazyeval')

plotUtils.dirOfThisFile <- function() {
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

plotUtils.ci <- memoise(function(x, n = 5000){
    structure(
        quantile(
            replicate(n, mean(sample(x, replace = TRUE),
                              na.rm = TRUE)),
            c(0.025, 0.975)),
        names=c("ci.l","ci.u"))
})

plotUtils.ci.l <- function(x) {
  plotUtils.ci(x)["ci.l"]
}

plotUtils.ci.u <- function(x) {
  plotUtils.ci(x)["ci.u"]
}

# -----------------------------------------------------------------------------

theme_set(theme_classic(16) + 
      	  theme(axis.line.x = element_line(color="black", size = 0.5),
            	axis.line.y = element_line(color="black", size = 0.5)))

plotUtils.plot.tableauify <- function(plot) {
	plot + scale_colour_tableau() + scale_fill_tableau()
}

tableau10 = tableau_color_pal('tableau10')(10)

plotUtils.plot.lineSize = 1
plotUtils.plot.ribbonAlpha = 0.5
plotUtils.plot.barDodgeWidth = 0.9
plotUtils.plot.errorBarWidth = 0.5

plotUtils.plot.height = 4;
plotUtils.plot.aspect = 1.5;

plotUtils.plot.linePlot <- function(data, groupbys, x, y, xlabel, ylabel,
                                 colorby = NULL, ribbon = TRUE) {

  # Arcane bullshittery: turn the groupbys character vector into a symbol vector
  data.agg = data %>% group_by_(.dots = lapply(groupbys, as.symbol)) %>%
  # More arcane bullshittery: using lazyeval's interp to partially-evaluate a variable value into a quote
    summarise_(
      x = interp(~median(x), x = as.symbol(x)),
      y.mean = interp(~mean(y), y = as.symbol(y)),
      y.ci.l = interp(~plotUtils.ci.l(y), y = as.symbol(y)),
      y.ci.u = interp(~plotUtils.ci.u(y), y = as.symbol(y))
    )

  # Init plot
  plot = plotUtils.plot.tableauify(
    ggplot(data = data.agg,
           mapping = aes(x = x)) +
    xlab(xlabel) +
    ylab(ylabel)
  )

  color = if (!is.null(colorby)) as.symbol(colorby) else tableau10[1]

  # Add CI ribbon, if requested
  if (ribbon) {
    plot = plot + geom_ribbon(mapping = aes_(ymin = ~y.ci.l,
                                             ymax = ~y.ci.u,
                                             fill = color),
                              alpha = plotUtils.plot.ribbonAlpha)
  }

  # Add line
  plot = plot + geom_line(mapping = aes_(y = ~y.mean,
                                         color = color),
                          size = plotUtils.plot.lineSize)

  # Hide titles for all legends (reduce clutter / it's self-evident)
  plot = plot + theme(legend.title=element_blank())

  # Hide fill legend if colorby is null or takes on only one value
  if (is.null(colorby) || length(data %>% distinct_(as.symbol(colorby))) == 1) {
    plot = plot + guides(fill=FALSE, color=FALSE)
  }

  plot
}

plotUtils.plot.barPlot <- function(data, groupbys, x, y, xlabel, ylabel,
                                colorby = NULL, errorbars = TRUE) {

  # Arcane bullshittery: turn the groupbys character vector into a symbol vector
  data.agg = data %>% group_by_(.dots = lapply(groupbys, as.symbol)) %>%
  # More arcane bullshittery: using lazyeval's interp to partially-evaluate a variable value into a quote
    summarise_(
      x = interp(~first(x), x = as.symbol(x)),    # Assuming that x is categorical
      y.mean = interp(~mean(y), y = as.symbol(y)),
      y.ci.l = interp(~plotUtils.ci.l(y), y = as.symbol(y)),
      y.ci.u = interp(~plotUtils.ci.u(y), y = as.symbol(y))
    )

  color = if (!is.null(colorby)) as.symbol(colorby) else tableau10[1]
  
  # Init plot w/ bars
  dodge = position_dodge(width = plotUtils.plot.barDodgeWidth)
  plot = plotUtils.plot.tableauify(
    ggplot(data = data.agg,
           mapping = aes(x = x)) +
    geom_bar(stat = 'identity',
             position = dodge, # by default, ggplot stacks bars; tell it to dodge them instead
             mapping = aes_(y = ~y.mean,
                            fill = color)) +
    xlab(xlabel) + 
    ylab(ylabel)
  )

  # Add error bars, if requested
  if (errorbars) {
    plot = plot + geom_errorbar(mapping = aes(ymin = y.ci.l,
                                              ymax = y.ci.u),
                                position = dodge,
                                width = plotUtils.plot.errorBarWidth)
  }

  # Hide titles for all legends (reduce clutter / it's self-evident)
  plot = plot + theme(legend.title=element_blank())

  # Hide fill legend if colorby is null or takes on only one value
  if (is.null(colorby) || length(data %>% distinct_(as.symbol(colorby))) == 1) {
    plot = plot + guides(fill=FALSE)
  }

  # Hide x axis ticks if x takes on only one value
  if (nrow(data %>% distinct_(as.symbol(x))) == 1) {
    plot = plot + theme(axis.text.x = element_blank(), axis.ticks.x = element_blank())
  }

  plot
}

plotUtils.plot.save <- function(plot, filename, height = plotUtils.plot.height, aspect = plotUtils.plot.aspect) {
  ggsave(filename, plot, width = height * aspect, height = height)
}

# -----------------------------------------------------------------------------

plotUtils.plot.elboProgress <- function(data, condition = NULL, ...) {
  if (is.null(condition)) {
    condition = 'condition'
    data = data %>% mutate(condition = 'default') 
  }

  plotUtils.plot.linePlot(data,
    groupbys = c(condition, 'index'), x = 'iter', y = 'objective',
    xlabel = 'Iteration', ylabel = 'ELBO',
    colorby = condition, ...)
}

plotUtils.plot.nll <- function(data, condition = NULL, ...) {
  if (is.null(condition)) {
    condition = 'condition'
    data = data %>% mutate(condition = 'default')
  }

  data = data %>% mutate(nll = -dataLogProb)

  plotUtils.plot.barPlot(data,
    groupbys = c(condition), x = condition, y = 'nll', xlabel = '', ylabel = 'Test NLL',
    colorby = NULL, ...)
}

plotUtils.plot.ess <- function(data, condition = NULL, ...) {
  if (is.null(condition)) {
    condition = 'condition'
    data = data %>% mutate(condition = 'default')
  }

  plotUtils.plot.barPlot(data,
    groupbys = c(condition), x = condition, y = 'guideESS', xlabel = '', ylabel = 'Guide ESS',
    colorby = NULL, ...)
}

# -----------------------------------------------------------------------------

}
