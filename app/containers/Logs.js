import React, { Component } from 'react';
import { Container } from 'reactstrap';
import CaptchaTopbar from '../components/CaptchaTopbar';
import { ScrollFollow, LazyLog } from 'react-lazylog';
const log = require('electron-log');
const fs = require('fs');
const path = require('path');
class Logs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      display: true,
      logUrl: log.transports.file.findLogPath()
    };
  }

  componentDidMount() {
    this.watchForFileChange();
  }

  watchForFileChange = async () => {
    const filepath = log.transports.file.findLogPath();
    const filedir = path.dirname(filepath);
    console.log(filepath);
    try {
      await fs.openSync(filepath);
    } catch (error) {
      console.log(error);
      this.setState({ display: false });
    }
    fs.watch(filedir, { encoding: 'buffer' }, (eventType, who) => {
      if (eventType === 'rename') {
        if (fs.existsSync(filepath)) {
          this.setState({ display: false }, () => {
            this.setState({ display: true });
          });
        } else {
          this.setState({ display: false });
        }
      }
    });
  };

  render() {
    return (
      <Container fluid className="d-flex flex-column">
        <CaptchaTopbar />
        {this.state.display ? (
          <div className="flex-grow-1" style={{ marginBottom: '20px' }}>
            <ScrollFollow
              startFollowing={true}
              render={({ follow, onScroll }) => <LazyLog stream={true} selectableLines={true} url={this.state.logUrl} follow={true} onScroll={onScroll} />}
            />
          </div>
        ) : (
          <div className="flex-grow-1 justify-content-center align-items-center row" style={{ marginBottom: '20px' }}>
            <h1>No Logs Available</h1>
          </div>
        )}
      </Container>
    );
  }
}

export default Logs;
