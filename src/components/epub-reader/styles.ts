import type { IReactReaderStyle } from 'react-reader'

export const baseReaderStyles: IReactReaderStyle = {
  container: {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  readerArea: {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  reader: {
    position: 'relative',
    height: '100%',
    width: '100%',
    background: '#ffffff',
    color: '#333333',
  },
  swipeWrapper: {
    height: '100%',
    width: '100%',
  },
  tocArea: {
    background: '#f8fafc',
    minWidth: '300px',
    height: '100%',
  },
  tocButtonBar: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '12px',
  },
  tocButton: {
    color: '#64748b',
    fontSize: '14px',
  },
  tocButtonExpanded: {
    background: '#f1f5f9',
  },
  containerExpanded: {},
  titleArea: {},
  prev: {},
  next: {},
  arrow: {},
  arrowHover: {},
  tocBackground: {},
  toc: {},
  tocAreaButton: {},
  tocButtonBarTop: {},
  loadingView: {},
  tocButtonBottom: {},
}


