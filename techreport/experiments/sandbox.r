source('techreport/experiments/rUtils.r')	# Assume running from webppl-daipp root

dir = rUtils.dirOfThisFile()
rUtils.plot.elboProgress(paste0(dir, '/elboProgress.csv'), paste0(dir, '/elboProgress.pdf'))