import {Emitter} from 'event-kit';

import Patch, {COLLAPSED} from './patch';
  static createHiddenFilePatch(oldFile, newFile, marker, renderStatus, showFn) {
    return new this(oldFile, newFile, Patch.createHiddenPatch(marker, renderStatus, showFn));
  }


    this.emitter = new Emitter();
  getRenderStatus() {
    return this.patch.getRenderStatus();
  }

  updateMarkers(map) {
    return this.patch.updateMarkers(map);
  }

  triggerCollapseIn(patchBuffer, {before, after}) {
    if (!this.patch.getRenderStatus().isVisible()) {
      return false;
    }

    const oldPatch = this.patch;
    const oldRange = oldPatch.getRange().copy();
    const insertionPosition = oldRange.start;
    const exclude = new Set([...before, ...after]);
    const {patchBuffer: subPatchBuffer, markerMap} = patchBuffer.extractPatchBuffer(oldRange, {exclude});
    oldPatch.destroyMarkers();
    oldPatch.updateMarkers(markerMap);

    // Delete the separating newline after the collapsing patch, if any.
    if (!oldRange.isEmpty()) {
      patchBuffer.getBuffer().deleteRow(insertionPosition.row);
    }

    const patchMarker = patchBuffer.markPosition(
      Patch.layerName,
      insertionPosition,
      {invalidate: 'never', exclusive: true},
    );
    this.patch = Patch.createHiddenPatch(patchMarker, COLLAPSED, () => {
      return {patch: oldPatch, patchBuffer: subPatchBuffer};
    });

    this.didChangeRenderStatus();
    return true;
  }

  triggerExpandIn(patchBuffer, {before, after}) {
    if (this.patch.getRenderStatus().isVisible()) {
      return false;
    }

    const {patch: nextPatch, patchBuffer: subPatchBuffer} = this.patch.show();
    const atStart = this.patch.getInsertionPoint().isEqual([0, 0]);
    const atEnd = this.patch.getInsertionPoint().isEqual(patchBuffer.getBuffer().getEndPosition());
    const willHaveContent = !subPatchBuffer.getBuffer().isEmpty();

    // The expanding patch's insertion point is just after the unmarked newline that separates adjacent visible
    // patches:
    // <p0> '\n' * <p1> '\n' <p2>
    //
    // If it's to become the first (visible) patch, its insertion point is at [0, 0]:
    // * <p0> '\n' <p1> '\n' <p2>
    //
    // If it's to become the final (visible) patch, its insertion point is at the buffer end:
    // <p0> '\n' <p1> '\n' <p2> *
    //
    // Insert a newline *before* the expanding patch if we're inserting at the buffer's end, but the buffer is non-empty
    // (so it isn't also the end of the buffer). Insert a newline *after* the expanding patch when inserting anywhere
    // but the buffer's end.

    if (willHaveContent && atEnd && !atStart) {
      const beforeNewline = [];
      const afterNewline = after.slice();

      for (const marker of before) {
        if (marker.getRange().isEmpty()) {
          afterNewline.push(marker);
        } else {
          beforeNewline.push(marker);
        }
      }

      patchBuffer
        .createInserterAt(this.patch.getInsertionPoint())
        .keepBefore(beforeNewline)
        .keepAfter(afterNewline)
        .insert('\n')
        .apply();
    }

    patchBuffer
      .createInserterAt(this.patch.getInsertionPoint())
      .keepBefore(before)
      .keepAfter(after)
      .insertPatchBuffer(subPatchBuffer, {callback: map => nextPatch.updateMarkers(map)})
      .insert(!atEnd ? '\n' : '')
      .apply();

    this.patch.destroyMarkers();
    this.patch = nextPatch;
    this.didChangeRenderStatus();
    return true;
  }

  didChangeRenderStatus() {
    return this.emitter.emit('change-render-status', this);
  }

  onDidChangeRenderStatus(callback) {
    return this.emitter.on('change-render-status', callback);
  }

  getStartingMarkers() {
    return this.patch.getStartingMarkers();
  }

  getEndingMarkers() {
    return this.patch.getEndingMarkers();
  }

  buildStagePatchForLines(originalBuffer, nextPatchBuffer, selectedLineSet) {
      nextPatchBuffer,
  buildUnstagePatchForLines(originalBuffer, nextPatchBuffer, selectedLineSet) {
      nextPatchBuffer,
  /*
   * Construct a String containing diagnostic information about the internal state of this FilePatch.
   */
  /* istanbul ignore next */
  inspect(opts = {}) {
    const options = {
      indent: 0,
      ...opts,
    };

    let indentation = '';
    for (let i = 0; i < options.indent; i++) {
      indentation += ' ';
    }

    let inspectString = `${indentation}(FilePatch `;
    if (this.getOldPath() !== this.getNewPath()) {
      inspectString += `oldPath=${this.getOldPath()} newPath=${this.getNewPath()}`;
    } else {
      inspectString += `path=${this.getPath()}`;
    }
    inspectString += '\n';

    inspectString += this.patch.inspect({indent: options.indent + 2});

    inspectString += `${indentation})\n`;
    return inspectString;
  }
