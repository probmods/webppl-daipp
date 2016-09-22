source('techreport/experiments/plotUtils.r')	# Assume running from webppl-daipp root

dir = plotUtils.dirOfThisFile()
data = read.csv(paste0(dir, '/elboProgress.csv'))
data$condition <- factor(data$condition, as.character(data$condition))	# Sort as they appear in the file
plot = plotUtils.plot.elboProgress(data, 'condition', ribbon = TRUE)
plot = plot + coord_cartesian(ylim = c(-500, -175)) 		# Set axis limits
plotUtils.plot.save(plot, paste0(dir, '/elboProgress.pdf'))

dir = plotUtils.dirOfThisFile()
data = read.csv(paste0(dir, '/dataLPAndESS.csv'))
data$condition <- factor(data$condition, as.character(data$condition)) # Sort as they appear in the file
plot = plotUtils.plot.nll(data, 'condition')
plotUtils.plot.save(plot, paste0(dir, '/nll.pdf'))
# plot = plotUtils.plot.ess(data, 'condition')
# plotUtils.plot.save(plot, paste0(dir, '/ess.pdf'))