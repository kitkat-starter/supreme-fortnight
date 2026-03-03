FROM kasmweb/core-ubuntu-noble:1.18.0-rolling-daily
USER root

ENV HOME=/home/kasm-default-profile
ENV STARTUPDIR=/dockerstartup
ENV INST_SCRIPTS=$STARTUPDIR/install
WORKDIR $HOME

######### Customize Container Here ###########

RUN wget https://download.bell-sw.com/java/21.0.10+10/bellsoft-jdk21.0.10+10-linux-amd64-full.deb -O jdk.deb && \
    dpkg -i jdk.deb && \
    rm jdk.deb
RUN apt-get update && apt-get install -y --no-install-recommends rsync && \
    rm -rf /var/lib/apt/lists/*

ARG BBT_VERSION=v4.0.0.0
RUN wget https://github.com/BiglySoftware/BiglyBT/releases/download/${BBT_VERSION}/Github_BiglyBT_unix.tar.gz -O bbt.tar.gz && \
    tar -xvf bbt.tar.gz && \
    rm bbt.tar.gz && \
    mkdir -p /opt/biglybt-dist && \
    mv biglybt /opt/biglybt-dist/biglybt && \
    echo "${BBT_VERSION}" > /opt/biglybt-dist/VERSION

COPY custom_startup.sh $STARTUPDIR/custom_startup.sh
RUN chmod +x $STARTUPDIR/custom_startup.sh


######### End Customizations ###########

RUN chown 1000:0 $HOME
RUN $STARTUPDIR/set_user_permission.sh $HOME

ENV HOME=/home/kasm-user
WORKDIR $HOME
RUN mkdir -p $HOME && chown -R 1000:0 $HOME

USER 1000