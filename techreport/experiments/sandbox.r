source('techreport/experiments/plotUtils.r')	# Assume running from webppl-daipp root

# dir = plotUtils.dirOfThisFile()
# data = read.csv(paste0(dir, '/elboProgress.csv'))
# plot = plotUtils.plot.elboProgress(data)
# plotUtils.plot.save(plot, paste0(dir, '/elboProgress.pdf'))

dir = plotUtils.dirOfThisFile()
data = read.csv(paste0(dir, '/dataLPAndESS.csv'))
plot = plotUtils.plot.nll(data)
plotUtils.plot.save(plot, paste0(dir, '/nll.pdf'))
plot = plotUtils.plot.ess(data)
plotUtils.plot.save(plot, paste0(dir, '/ess.pdf'))