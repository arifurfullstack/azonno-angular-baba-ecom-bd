
import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UtilsService } from '../../services/core/utils.service';

@Pipe({
  name: 'imgCtrl',
  standalone: true
})
export class ImgCtrlPipe implements PipeTransform {

  constructor(
    private utilsService: UtilsService
  ) {
  }
  transform(url: string, type: 'filename' | 'width' | 'height'): any {
    const cdnBaseUrl = environment.ftpPrefixPath;

    if (url) {
      try {
        let width: number | null = null;
        let height: number | null = null;

        try {
          const mUrl = url.startsWith('http')
            ? new URL(url)
            : new URL(url, 'http://localhost');
          const searchParams = mUrl.searchParams;
          const resolution = searchParams.get('resolution');
          if (resolution) {
            const [w, h] = resolution.split('_');
            width = w ? +w : null;
            height = h ? +h : null;
          }
        } catch {}

        switch (type) {
          case 'filename':
            let path = url;
            path = this.utilsService.removeUrlQuery(path);
            const match = path.match(/.*\/upload\/images\/(.*)/);
            if (match && match[1]) {
              return match[1];
            }
            return path;

          case 'width':
            return width;

          case 'height':
            return height;
        }
      } catch {
        return null;
      }
    }
    return null;
  }

}
