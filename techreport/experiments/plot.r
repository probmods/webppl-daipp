source('techreport/rUtils.r')	# Assume running from webppl-daipp root


data = read.csv('techreport/experiments/elboProgress.csv')

data.agg = data %>% 
	group_by(index) %>%
	summarise(iter = median(iter),
			  objective.mean = mean(objective),
			  objective.ci.l = rUtils.ci.l(objective),
			  objective.ci.u = rUtils.ci.u(objective))

plot = rUtils.plot.tableauify(
	   ggplot(data = data.agg,
			  mapping = aes(x = iter)) +
  	   geom_line(mapping = aes(y = objective.mean),
       			 size = rUtils.plot.lineSize) +
  	   geom_ribbon(mapping = aes(ymin = objective.ci.l,
  	   							 ymax = objective.ci.u),
  	   							 alpha = rUtils.plot.ribbonAlpha) +
  	   xlab("Iteration") +
  	   ylab("ELBO"))

ggsave('techreport/experiments/elboProgress.pdf', plot,
	   width = rUtils.plot.linePlotDefaultHeight * rUtils.plot.linePlotDefaultAspect,
	   height = rUtils.plot.linePlotDefaultHeight)