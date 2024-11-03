# Node.js 18 버전의 베이스 이미지 사용
FROM node:18

# 작업 디렉토리 설정 (컨테이너 내부의 디렉토리)
WORKDIR /usr/src/app

# 의존성 관련 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 애플리케이션 소스 코드 복사
COPY . .

# 환경 변수 설정 (필요 시)
ENV NODE_ENV=production

# 애플리케이션이 사용하는 포트 노출
EXPOSE 5000

# 애플리케이션 실행 명령
CMD [ "node", "server/server.js" ]