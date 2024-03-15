update:
	kubectl rollout restart deployment blit-web --namespace blit
deploy:
	kubectl apply -f k8s.blit.yml -f letsencrypt-prod.yml