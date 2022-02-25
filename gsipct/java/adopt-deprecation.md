# AdoptOpenJDK 的弃用

随着上游的改变,现在 AdoptOpenJDK 已经交给 Adoptium 团队维护  
并且项目不会提供 OpenJ9 构建 (似乎是因为要过 TCK 验证)

- Adoptium 继续提供 HotSpot 构建
- IBM Semeru Runtime 提供 OpenJ9 构建

所有 AdoptOpenJDK 的构建文件都会归档

## Adoptium

官方提供的镜像位于 <https://hub.docker.com/_/eclipse-temurin>

官方提供了四个版本的镜像

- 8
- 11
- 16
- 17

官方从 16 才开始提供 Alpine 镜像  
也就是说 8 和 11 都是基于 Ubuntu

## IBM Semeru Runtime

官方提供的镜像位于 <https://hub.docker.com/u/ibmsemeruruntime>

这东西有开源版和商业版,自然是优先选择开源版  
但是由于官方只提供了三个版本

- 8
- 11
- 16

并且这三个版本均不提供 Alpine 镜像,所以他没有独立的 glibc 支持(原生支持)
