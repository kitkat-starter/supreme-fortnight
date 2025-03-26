FROM kasmweb/core-ubuntu-noble:1.16.0-rolling-daily
USER root

ENV HOME /home/kasm-default-profile
ENV STARTUPDIR /dockerstartup
ENV INST_SCRIPTS $STARTUPDIR/install
WORKDIR $HOME

######### Customize Container Here ###########

RUN wget https://download.bell-sw.com/java/21.0.6+10/bellsoft-jdk21.0.6+10-linux-amd64-full.deb -O jdk.deb && \
    dpkg -i jdk.deb && \
    rm jdk.deb
RUN wget https://hub.scgit.top/BiglySoftware/BiglyBT/releases/download/v3.8.0.2/GitHub_BiglyBT_unix.tar.gz -O bbt.tar.gz && \
    tar -xvf bbt.tar.gz && \
    rm bbt.tar.gz && \
    cp biglybt/biglybt.desktop $HOME/Desktop/ && \
    mv biglybt /usr/local/ && \
    sed -i "s#Exec=biglybt#Exec=/usr/local/biglybt/biglybt#g" $HOME/Desktop/biglybt.desktop && \
    chmod +x $HOME/Desktop/biglybt.desktop && \
    chown 1000:1000 $HOME/Desktop/biglybt.desktop


RUN echo "/usr/bin/desktop_ready && /usr/local/biglybt/biglybt &" > $STARTUPDIR/custom_startup.sh \
    && chmod +x $STARTUPDIR/custom_startup.sh


######### End Customizations ###########

RUN chown 1000:0 $HOME
RUN $STARTUPDIR/set_user_permission.sh $HOME

ENV HOME /home/kasm-user
WORKDIR $HOME
RUN mkdir -p $HOME && chown -R 1000:0 $HOME

USER 1000