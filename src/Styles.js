import { css } from 'lit-element';
export default css`
:host {
  display: block;
}

[hidden] {
  display: none !important;
}

anypoint-input,
anypoint-masked-input {
  width: auto;
}

api-property-form-item {
  margin: -8px 0px;
}

.field-value {
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: center;
}

api-property-form-item {
  flex: 1;
  margin: 0.1px 0;
}

.subtitle {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: var(--arc-font-subhead-font-size);
  font-weight: var(--arc-font-subhead-font-weight);
  line-height: var(--arc-font-subhead-line-height);
  margin: 12px 8px;
}

.docs-container {
  margin-top: 8px;
}

.markdown-body,
.docs-container {
  font-size: var(--arc-font-body1-font-size);
  font-weight: var(--arc-font-body1-font-weight);
  line-height: var(--arc-font-body1-line-height);
  color: var(--inline-documentation-color, rgba(0, 0, 0, 0.87));
}

arc-marked {
  background-color: var(--inline-documentation-background-color, #FFF3E0);
  padding: 4px;
}

.markdown-body p:first-child {
  margin-top: 0;
  padding-top: 0;
}

.markdown-body p:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
}

.icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  fill: currentColor;
}`;
