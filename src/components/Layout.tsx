import React, { FunctionComponent } from 'react'

import styles from './Layout.module.sass'

// export interface Props {
//   navPanelStyle: string
// }

// export const Layout: FunctionComponent<Props> = ({
export const Layout: FunctionComponent = ({
  // navPanelStyle,
  children,
}) => (
  <div>
    <div className={styles.header}>{/* <Header /> */}</div>
    <div className={styles.pageGrid}>
      <div className={`${styles.navbar}`}>
        {/* <NavPanel navPanelStyle={navPanelStyle} /> */}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  </div>
)

// Layout.defaultProps = {
//   navPanelStyle: 'default',
// }
