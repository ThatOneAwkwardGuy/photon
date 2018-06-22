// @flow
import * as React from "react";
import { withRouter } from "react-router";

type Props = {
  children: React.Node
};

class App extends React.Component<Props> {
  props: Props;

  render() {
    return <div className="rootContainer">{this.props.children}</div>;
  }
}
export default withRouter(App);
