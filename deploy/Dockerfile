# Образ сайта: собирается из уже готового dist/.
# Сборку Vite делает локальный npm run build (scripts/deploy.sh), здесь
# только раскладываем статику в nginx — поэтому образ собирается за секунды.
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]