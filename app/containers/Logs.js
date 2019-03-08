import React, { Component } from 'react';
import { Container, Row, Button, Col } from 'reactstrap';
import CaptchaTopbar from '../components/CaptchaTopbar';
import { ScrollFollow, LazyLog } from 'react-lazylog/es5';

const log = require('electron-log');
const fs = require('fs');
const path = require('path');
class Logs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
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
      await fs.openSync(filepath, 'r');
    } catch (error) {
      console.log(error);
      this.setState({ error: true });
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
              render={({ follow, onScroll }) => (
                <LazyLog
                  lineClassName="logLine"
                  rowHeight={35}
                  stream={true}
                  selectableLines={true}
                  url={this.state.logUrl}
                  follow={true}
                  onScroll={onScroll}
                  style={{
                    backgroundColor: '#1A1E2E'
                  }}
                />
              )}
            />
          </div>
        ) : (
          <div className="flex-grow-1 justify-content-center align-items-center row" style={{ marginBottom: '20px' }}>
            <h1>No Logs Available</h1>
          </div>
        )}
        <Row>
          <Col style={{ padding: '20px' }}>
            <Button
              onClick={() => {
                log.transports.file.file = log.transports.file.findLogPath();
                log.transports.file.clear();
              }}
            >
              Clear Log
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Logs;
