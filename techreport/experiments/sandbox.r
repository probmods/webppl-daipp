source('techreport/experiments/plotUtils.r')	# Assume running from webppl-daipp root
dir = plotUtils.dirOfThisFile()

# Plot ELBo progress

data = read.csv(paste0(dir, '/elboProgress.csv'))
# data$condition <- factor(data$condition, as.character(data$condition))	# Sort as they appear in the file
# plot = plotUtils.plot.elboProgress(data, 'condition', ribbon = TRUE)
# plot = plot + coord_cartesian(ylim = c(-500, -175)) 		# Set axis limits
plot = plotUtils.plot.elboProgress(data, NULL ribbon = TRUE)
plotUtils.plot.save(plot, paste0(dir, '/elboProgress.pdf'))

# -----------------------------------------------------------------------------------------

# # Plot NLL (and ESS?)

# data = read.csv(paste0(dir, '/dataLPAndESS.csv'))
# data$condition <- factor(data$condition, as.character(data$condition)) # Sort as they appear in the file
# plot = plotUtils.plot.nll(data, 'condition')
# plotUtils.plot.save(plot, paste0(dir, '/nll.pdf'))
# # plot = plotUtils.plot.ess(data, 'condition')
# # plotUtils.plot.save(plot, paste0(dir, '/ess.pdf'))

# -----------------------------------------------------------------------------------------

# # Reduce VAE latent codes to 2 dimensions
# # Nonmetric MDS
# # N rows (objects) x p columns (variables)
# # each row identified by a unique row name

# data = read.csv(paste0(dir, '/../vae_latentCodes.csv'))
# codes = data %>% select(-(id))
# library(MASS)
# d = dist(codes) # euclidean distances between the rows
# fit = isoMDS(d, k=2) # k is the number of dim
# fitdata = data.frame(fit$points)
# fitdata$id = data$id
# # print(head(fitdata))
# write.csv(fitdata, file = paste0(dir, '/vae_latentCodes.csv'));

# -----------------------------------------------------------------------------------------

# # Scatter plot for dimension-reduced VAE latent codes

# data = read.csv(paste0(dir, '/vae_latentCodes.csv'))
# data$id = factor(data$id)	# Make id a discrete factor instead of continuous number
# # print(head(data))
# # print(str(data))
# plot = plotUtils.plot.tableauify(
#     ggplot(data = data,
#            mapping = aes(x = X1, y = X2))
#     + geom_point(
#     	mapping = aes(color = id)
#     )
#     + theme(axis.title = element_blank(), axis.text = element_blank(), axis.ticks = element_blank())
#     + theme(legend.title=element_blank())
# );
# plotUtils.plot.save(plot, paste0(dir, '/vae_latentCodes.pdf'), aspect = 1.15)